#!/usr/bin/env python3
"""Pull verified public HoMoW releases on the VPS, with a health-checked rollback."""
import argparse
import fcntl
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request

REPOSITORY = 'reformoti/Hold-Monster-World'
API = 'https://api.github.com/repos/' + REPOSITORY
SHA = re.compile(r'^[0-9a-f]{40}$')


def run(*args, capture=False):
    result = subprocess.run([str(a) for a in args], check=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.decode().strip() if capture else None


def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'HoMoW-auto-update',
                                                'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)


def verified_head():
    """Only the current main head, with a successful push run of our exact CI file."""
    head = request(API + '/git/ref/heads/main')['object']['sha']
    if not SHA.fullmatch(head):
        raise ValueError('GitHub returned an invalid commit')
    data = request(API + '/actions/runs?branch=main&event=push&head_sha=' + head + '&per_page=100')
    checks = [r for r in data.get('workflow_runs', [])
              if r.get('head_sha') == head and r.get('head_branch') == 'main'
              and r.get('event') == 'push'
              and r.get('path', '').split('@')[0] == '.github/workflows/verify.yml'
              and r.get('head_repository', {}).get('full_name') == REPOSITORY]
    latest = max(checks, key=lambda r: (r.get('run_number', 0), r.get('run_attempt', 0)), default=None)
    return head if latest and latest.get('status') == 'completed' and latest.get('conclusion') == 'success' else None


def compose(release, env_file, image, *args):
    override = release / '.homow-image.json'
    override.write_text(json.dumps({'services': {'game': {'image': image}}}))
    override.chmod(0o600)
    return run('docker', 'compose', '--project-name', 'homow', '--env-file', env_file,
               '-f', release / 'deploy/vps/compose.yaml', '-f', override, *args)


def healthy(release=None):
    """Check the running application, rather than only Docker's process state."""
    expected = (release / 'release.js').read_bytes() if release else None
    for _ in range(15):
        try:
            if not request('http://127.0.0.1:3000/health').get('ok'):
                raise ValueError('App unhealthy')
            with urllib.request.urlopen('http://127.0.0.1:3000/release.js', timeout=10) as response:
                if expected is not None and response.read() != expected:
                    raise ValueError('Wrong application release')
            return
        except (OSError, ValueError):
            time.sleep(2)
    raise RuntimeError('The new application did not pass its health/version check')


def git(checkout, *args, capture=False):
    # The timer runs as root; trust only the selected existing game checkout.
    return run('git', '-c', 'safe.directory=' + str(checkout), '-C', checkout, *args, capture=capture)


def prepare_release(checkout, root, sha):
    git(checkout, 'fetch', '--no-tags', 'https://github.com/' + REPOSITORY + '.git',
        'refs/heads/main')
    git(checkout, 'cat-file', '-e', sha + '^{commit}')
    git(checkout, 'merge-base', '--is-ancestor', sha, 'FETCH_HEAD')
    release = root / 'releases' / sha
    release.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Export tracked source only: no passwords, .env files, or uncommitted edits.
    archive = subprocess.run(['git', '-c', 'safe.directory=' + str(checkout), '-C', str(checkout),
                              'archive', '--format=tar', sha], check=True, stdout=subprocess.PIPE).stdout
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(release, filter='data')
    env_file = checkout / 'deploy/vps/.env'
    link = release / 'deploy/vps/.env'
    if link.is_symlink():
        link.unlink()
    elif link.exists():
        raise RuntimeError('Refusing to replace a tracked environment file')
    link.symlink_to(env_file)
    return release


def deploy(checkout, root, sha):
    env_file = checkout / 'deploy/vps/.env'
    if not env_file.is_file():
        raise RuntimeError('Existing deploy/vps/.env is required; no database is created')
    state_file = root / 'current.json'
    state = json.loads(state_file.read_text()) if state_file.exists() else {}
    if state.get('sha') == sha:
        print('Already running verified commit ' + sha, flush=True)
        return
    failed_file = root / 'failed.json'
    failed = json.loads(failed_file.read_text()) if failed_file.exists() else {}
    if failed.get('sha') == sha:
        print('This commit previously failed activation; waiting for a new verified commit', flush=True)
        return
    previous_release = Path(state.get('release', str(checkout)))
    previous_container = run('docker', 'ps', '-q', '--filter', 'label=com.docker.compose.project=homow',
                             '--filter', 'label=com.docker.compose.service=game', capture=True).splitlines()
    previous_image = run('docker', 'inspect', '--format', '{{.Image}}', previous_container[0], capture=True) if previous_container else None
    rollback = 'homow-game:rollback'
    if previous_image:
        run('docker', 'image', 'tag', previous_image, rollback)
    release = prepare_release(checkout, root, sha)
    image = 'homow-game:' + sha
    print('Building verified commit ' + sha, flush=True)
    # Build before touching the live container. The DB connection stays in its existing .env.
    compose(release, env_file, image, 'build', 'game')
    # A newer push during the build must be tested before it can replace this deployment.
    if request(API + '/git/ref/heads/main')['object']['sha'] != sha:
        print('Main advanced during build; waiting for the next verified commit', flush=True)
        return
    try:
        compose(release, env_file, image, 'up', '-d', '--no-build', '--wait', '--wait-timeout', '150', 'game')
        healthy(release)
    except Exception:
        # Avoid restarting players every three minutes for the same broken release.
        failed_file.write_text(json.dumps({'sha': sha, 'failed_at': int(time.time())}) + '\n')
        failed_file.chmod(0o600)
        if previous_image:
            print('New release failed; restoring the previous image', flush=True)
            compose(previous_release, env_file, rollback, 'up', '-d', '--no-build', '--wait', '--wait-timeout', '150', 'game')
            healthy()
        raise
    temporary = root / 'current.json.tmp'
    temporary.write_text(json.dumps({'sha': sha, 'release': str(release), 'image': image,
                                     'updated_at': int(time.time())}) + '\n')
    temporary.chmod(0o600)
    temporary.replace(state_file)
    failed_file.unlink(missing_ok=True)
    # Keep just this release and its predecessor; never prune unrelated Docker data.
    keep = {sha, state.get('sha')}
    for old in (root / 'releases').iterdir():
        if SHA.fullmatch(old.name) and old.name not in keep and old.is_dir() and not old.is_symlink():
            shutil.rmtree(old)
            subprocess.run(['docker', 'image', 'rm', 'homow-game:' + old.name], check=False)
    print('Deployed and verified ' + sha, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkout', type=Path, default=Path('/var/www/homow'))
    parser.add_argument('--state', type=Path, default=Path('/var/lib/homow-auto-update'))
    parser.add_argument('--check', action='store_true', help='Read CI status only; do not deploy')
    args = parser.parse_args()
    if args.check:
        print(verified_head() or 'Main is still being checked or failed CI; no deployment')
        return
    root = args.state.resolve()
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (root / 'update.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another deployment is active; skipping')
            return
        sha = verified_head()
        if sha:
            deploy(args.checkout.resolve(), root, sha)
        else:
            print('Main has no successful verification yet; keeping the running game')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('HoMoW auto-update failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
