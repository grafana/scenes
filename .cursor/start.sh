#!/usr/bin/env bash
#
# Startup command for grafana/scenes Cursor Cloud agents.
# Starts the Docker daemon so the scenes-app demo container can run.
# No-op when Docker is not installed or the daemon is already up.
set -uo pipefail

if command -v docker >/dev/null 2>&1; then
  if ! sudo docker info >/dev/null 2>&1; then
    sudo bash -c 'nohup dockerd > /var/log/dockerd.log 2>&1 &'
    for _ in $(seq 1 30); do
      sudo docker info >/dev/null 2>&1 && break
      sleep 1
    done
  fi
fi
