#!/usr/bin/env bash
# Run once from the existing VPS checkout; secrets stay in deploy/vps/.env.
set -euo pipefail
if [[ $EUID -ne 0 ]]; then
  echo 'Run this installer with sudo.' >&2
  exit 1
fi
checkout=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)
[[ -f "$checkout/deploy/vps/.env" ]] || { echo 'The existing VPS deploy/vps/.env is required.' >&2; exit 1; }
[[ "$checkout" == /var/www/homow ]] || { echo 'Install from the existing /var/www/homow checkout.' >&2; exit 1; }
for program in python3 git docker; do command -v "$program" >/dev/null; done
python3 -c 'import sys; assert sys.version_info >= (3, 12), "Python 3.12+ is required"'
docker compose version >/dev/null
# Freeze the updater as root-owned code; game releases cannot silently rewrite it.
install -d -m 0755 /usr/local/libexec
install -m 0755 "$checkout/deploy/vps/auto-update.py" /usr/local/libexec/homow-auto-update.py
install -d -m 0700 /var/lib/homow-auto-update
cat > /etc/systemd/system/homow-auto-update.service <<'UNIT'
[Unit]
Description=Deploy CI-verified HoMoW updates
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=root
UMask=0077
ExecStart=/usr/bin/python3 /usr/local/libexec/homow-auto-update.py --checkout /var/www/homow
TimeoutStartSec=30min
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
StandardOutput=journal
StandardError=journal
UNIT
cat > /etc/systemd/system/homow-auto-update.timer <<'UNIT'
[Unit]
Description=Check verified HoMoW updates every three minutes

[Timer]
OnBootSec=90s
OnUnitInactiveSec=3min
RandomizedDelaySec=15s
Unit=homow-auto-update.service

[Install]
WantedBy=timers.target
UNIT
systemd-analyze verify /etc/systemd/system/homow-auto-update.service /etc/systemd/system/homow-auto-update.timer
systemctl daemon-reload
systemctl enable --now homow-auto-update.timer
systemctl start --no-block homow-auto-update.service
echo 'Auto-update enabled. Status: sudo journalctl -u homow-auto-update.service -n 40 --no-pager'
