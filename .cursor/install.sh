#!/usr/bin/env bash
#
# Provisions the development environment for grafana/scenes Cursor Cloud agents.
# Runs during environment builds (baked into the snapshot) and on VM startup,
# so it MUST be idempotent and safe to re-run.
#
# Sets up: Node (pinned to .nvmrc) via nvm, Docker (best-effort, only needed for
# the scenes-app demo), and JS dependencies via yarn.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

NODE_VERSION="$(tr -d 'v \t\r\n' < .nvmrc 2>/dev/null || echo '24.5.0')"

# --- Node (via nvm), pinned to .nvmrc ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if command -v nvm >/dev/null 2>&1; then
  nvm install "$NODE_VERSION" >/dev/null
  nvm alias default "$NODE_VERSION" >/dev/null
fi
# A system node earlier in PATH (e.g. /exec-daemon/node) can shadow nvm's node in
# non-login shells, so make the pinned version win for future shells too.
NODE_BIN="$NVM_DIR/versions/node/v$NODE_VERSION/bin"
if [ -d "$NODE_BIN" ]; then
  export PATH="$NODE_BIN:$PATH"
  if ! grep -q "versions/node/v$NODE_VERSION/bin" "$HOME/.bashrc" 2>/dev/null; then
    printf '\n[ -d "%s" ] && export PATH="%s:$PATH"\n' "$NODE_BIN" "$NODE_BIN" >> "$HOME/.bashrc"
  fi
fi
corepack enable >/dev/null 2>&1 || true

# --- Docker (best-effort; only required for the scenes-app demo container) ---
# A failure here must not abort setup: library dev (build/test/lint) does not need Docker.
if ! command -v docker >/dev/null 2>&1; then
  (
    set -e
    sudo install -m 0755 -d /etc/apt/keyrings
    curl --retry 3 --retry-delay 5 -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin fuse-overlayfs iptables
    sudo mkdir -p /etc/docker
    printf '%s\n' '{' '  "storage-driver": "fuse-overlayfs"' '}' | sudo tee /etc/docker/daemon.json > /dev/null
    sudo update-alternatives --set iptables /usr/sbin/iptables-legacy || true
    sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy || true
  ) || echo "WARN: Docker install failed; the scenes-app demo will be unavailable, but library dev (build/test/lint) still works."
fi

# --- JS dependencies ---
yarn install
