"""No live infrastructure: verify deployment gating and recovery with a fake Docker."""
import importlib.util
import json
import io
import os
import tarfile
from types import SimpleNamespace
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('homow_updater', Path(__file__).with_name('auto-update.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
SHA = 'a' * 40


class VerificationTests(unittest.TestCase):
    def run_check(self, **changes):
        run = dict(head_sha=SHA, head_branch='main', event='push', path='.github/workflows/verify.yml',
                   head_repository={'full_name': updater.REPOSITORY}, run_number=1, run_attempt=1,
                   status='completed', conclusion='success')
        run.update(changes)
        with patch.object(updater, 'request', side_effect=[{'object': {'sha': SHA}}, {'workflow_runs': [run]}]):
            return updater.verified_head()

    def test_only_the_exact_successful_main_push_is_deployable(self):
        self.assertEqual(self.run_check(), SHA)
        for change in [dict(conclusion='failure'), dict(status='in_progress'), dict(event='pull_request'),
                       dict(head_branch='feature'), dict(path='.github/workflows/other.yml'),
                       dict(head_repository={'full_name': 'other/repository'}), dict(head_sha='b' * 40)]:
            self.assertIsNone(self.run_check(**change))

    def test_a_failed_latest_rerun_does_not_reuse_an_older_success(self):
        run = dict(head_sha=SHA, head_branch='main', event='push', path='.github/workflows/verify.yml',
                   head_repository={'full_name': updater.REPOSITORY}, run_number=1,
                   status='completed', conclusion='success', run_attempt=1)
        with patch.object(updater, 'request', side_effect=[{'object': {'sha': SHA}},
                          {'workflow_runs': [run, dict(run, conclusion='failure', run_attempt=2)]}]):
            self.assertIsNone(updater.verified_head())


class ArchiveTests(unittest.TestCase):
    def test_systemd_private_umask_does_not_make_container_source_unreadable(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            checkout = base / 'checkout'
            env_file = checkout / 'deploy/vps/.env'
            env_file.parent.mkdir(parents=True)
            env_file.write_text('private configuration')
            archive = io.BytesIO()
            with tarfile.open(fileobj=archive, mode='w') as source:
                for name in ['homow-server', 'deploy', 'deploy/vps']:
                    entry = tarfile.TarInfo(name)
                    entry.type = tarfile.DIRTYPE
                    entry.mode = 0o755
                    source.addfile(entry)
                entry = tarfile.TarInfo('homow-server/server.mjs')
                entry.mode = 0o644
                entry.size = 7
                source.addfile(entry, io.BytesIO(b'export;'))
            previous_umask = os.umask(0o077)
            try:
                with patch.object(updater, 'git'), patch.object(updater.subprocess, 'run',
                     return_value=SimpleNamespace(stdout=archive.getvalue())):
                    release = updater.prepare_release(checkout, base / 'state', SHA)
            finally:
                os.umask(previous_umask)
            self.assertEqual((release / 'homow-server').stat().st_mode & 0o777, 0o755)
            self.assertEqual((release / 'deploy/vps').stat().st_mode & 0o777, 0o755)
            self.assertEqual((release / 'homow-server/server.mjs').stat().st_mode & 0o777, 0o644)
            self.assertTrue((release / 'deploy/vps/.env').is_symlink())
            self.assertEqual((release / 'deploy/vps/.env').resolve(), env_file)
            self.assertEqual(env_file.read_text(), 'private configuration')


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.checkout = self.base / 'checkout'
        (self.checkout / 'deploy/vps').mkdir(parents=True)
        (self.checkout / 'deploy/vps/.env').write_text('DATABASE_URL=private-test-placeholder\n')
        self.root = self.base / 'state'
        self.root.mkdir()
        self.release = self.root / 'releases' / SHA
        self.release.mkdir(parents=True)
        self.release.joinpath('release.js').write_text('release')
        self.calls = []

    def fake_run(self, *args, capture=False):
        self.calls.append(args)
        if args[:2] == ('docker', 'ps'):
            return 'previous-container'
        if args[:2] == ('docker', 'inspect'):
            return 'sha256:previous-image'
        return '' if capture else None

    def perform(self, compose=None, healthy=None, head=SHA):
        with patch.object(updater, 'run', side_effect=self.fake_run), \
             patch.object(updater, 'prepare_release', return_value=self.release), \
             patch.object(updater, 'compose', side_effect=compose) as build, \
             patch.object(updater, 'healthy', side_effect=healthy) as check, \
             patch.object(updater, 'request', return_value={'object': {'sha': head}}):
            updater.deploy(self.checkout, self.root, SHA)
            return build, check

    def test_success_builds_before_restart_and_records_exact_commit(self):
        build, check = self.perform()
        self.assertEqual(build.call_args_list[0].args[3:], ('build', 'game'))
        self.assertIn('--no-build', build.call_args_list[1].args)
        check.assert_called_once_with(self.release)
        state = json.loads((self.root / 'current.json').read_text())
        self.assertEqual(state['sha'], SHA)
        self.assertNotIn('DATABASE_URL', json.dumps(state))

    def test_build_failure_never_touches_the_running_container(self):
        with self.assertRaisesRegex(RuntimeError, 'build'):
            self.perform(compose=RuntimeError('build failed'))
        self.assertFalse((self.root / 'current.json').exists())

    def test_failed_health_rolls_back_the_previous_image_without_replacing_state(self):
        original = {'sha': 'b' * 40, 'release': str(self.checkout)}
        (self.root / 'current.json').write_text(json.dumps(original))
        operations = []
        def record(*args):
            operations.append(args)
        with self.assertRaisesRegex(RuntimeError, 'health'):
            self.perform(compose=record, healthy=[RuntimeError('health failed'), None])
        self.assertEqual(json.loads((self.root / 'failed.json').read_text())['sha'], SHA)
        self.assertEqual(len(operations), 3)
        self.assertEqual(operations[2][2], 'homow-game:rollback')
        self.assertEqual(json.loads((self.root / 'current.json').read_text()), original)

    def test_advanced_main_during_build_keeps_the_live_game(self):
        build, check = self.perform(head='c' * 40)
        self.assertEqual(build.call_count, 1)
        check.assert_not_called()
        self.assertFalse((self.root / 'current.json').exists())

    def test_already_deployed_commit_is_not_rebuilt(self):
        (self.root / 'current.json').write_text(json.dumps({'sha': SHA}))
        build, check = self.perform()
        build.assert_not_called()
        check.assert_not_called()
        self.assertEqual(self.calls, [])

    def test_failed_activation_is_not_retried_until_a_new_commit(self):
        (self.root / 'failed.json').write_text(json.dumps({'sha': SHA}))
        build, check = self.perform()
        build.assert_not_called()
        check.assert_not_called()
        self.assertEqual(self.calls, [])

    def test_no_existing_database_configuration_means_no_deployment(self):
        (self.checkout / 'deploy/vps/.env').unlink()
        with self.assertRaisesRegex(RuntimeError, '.env'):
            self.perform()
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
