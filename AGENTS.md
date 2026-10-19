# AGENTS.md

This file provides guidance to AI agents when working with code in the scenes repository.

## Project Overview

Scenes is a react based framework to develop dashboard like applications for Grafana.

## Principles

- Follow existing patterns in the surrounding code
- Write tests for new functionality
- Keep changes focused — avoid over-engineering
- Security: prevent XSS, SQL injection, command injection

## Comments

- Only add a comment when it explains **why** something is done or reveals non-obvious logic that a reader must know to safely change the code. If the code is self-explanatory, no comment is needed.
- Never include links (Slack, GitHub, Jira, etc.) in code comments.

## Human Review Gates

Before running `git push`, stop and get explicit human approval. When changes are ready, show a summary of changes and wait for instruction. "Open a PR" in a task description is intent, not permission to push without review.

## Commands

### Build & Run

```bash
yarn dev                          # Build and watch for changes
yarn build                        # Frontend production build
```

### Test

```bash
yarn test:scenes path/to/file  --watch=false                     # Run tests for a specific file inside scenes library
yarn test:scenes -t "pattern"  --watch=false                     # Run tests by pattern for scenes library
yarn test:scenes -u --watch=false                                # Update snapshots for scenes library

yarn test:scenes-react path/to/file --watch=false                # Run tests for a specific file inside scenes-react library
yarn test:scenes-react -t "pattern" --watch=false                # Run tests by pattern for scenes-react library
yarn test:scenes-react -u --watch=false                          # Update snapshots for scenes-react library
```

### Lint & Format

```bash
yarn lint                         # ESLint
yarn lint:fix                     # ESLint auto-fix
yarn prettier:write               # Prettier auto-format
yarn typecheck                    # TypeScript check
```

## Architecture

## Cursor Cloud specific instructions

This is a Yarn 4 (Corepack) monorepo with three products under `packages/`: the `@grafana/scenes` SDK, `@grafana/scenes-react`, and `scenes-app` (a Grafana app plugin demo). Standard `yarn build` / `yarn test` / `yarn lint` / `yarn typecheck` / `yarn dev` commands are documented above and run across the two libraries + the demo app via Turborepo.

### Node version

- The repo pins Node `24.5.0` (`.nvmrc`), installed via `nvm`. The startup update script prepends it to `PATH`, and `~/.bashrc` does the same for login shells.
- Gotcha: a system `/exec-daemon/node` (v22) is earlier in `PATH` and shadows Node 24 in non-login shells. If `node --version` shows v22 or `yarn` is "command not found", run `export PATH="$HOME/.nvm/versions/node/v24.5.0/bin:$PATH"` (then `corepack enable`) before yarn commands.

### Running the demo app (scenes-app) end to end

The demo app runs inside a real Grafana container via `packages/scenes-app/docker-compose.yaml` and is served at http://localhost:3001/a/grafana-scenes-app (anonymous admin auth, no login).

- Docker is preinstalled but the daemon is not auto-started. Start it once per VM: `sudo dockerd > /tmp/dockerd.log 2>&1 &` (a tmux session works well). The daemon is configured for this VM with the `fuse-overlayfs` storage driver and iptables-legacy.
- The compose file defaults to `grafana/grafana:13.2.4`: `cd packages/scenes-app && sudo docker compose up -d --build`. The app's build externalizes `react/jsx-runtime`, which Grafana shares with plugins from 12.3.0 (and from the 11.6.11, 12.0.10, 12.1.7 and 12.2.5 patch releases); on older versions, e.g. 11.1, the app shows "App not found" with a `react/jsx-runtime` 404. To test another build, override both the image and the tag, e.g. `GRAFANA_IMAGE=grafana-dev GRAFANA_VERSION=<build-tag>`.
- The compose setup also starts Prometheus, which scrapes the Grafana container and backs the `gdev-prometheus` data source used by the Grafana monitoring, ad hoc filters and group by demos. An always-firing alert rule (`provisioning/prometheus/alert.yml`) makes the `ALERTS` series exist; it takes ~30s after startup to appear.
- `dist/` is bind-mounted into Grafana, so either a production (`yarn build`) or a development (`yarn dev`) build can be served. Grafana reads `dist/plugin.json` only at startup, so restart the container after it changes.
- After changing `dist/`, the volume is live; hard-reload the browser (Ctrl+Shift+R) since Grafana caches plugin modules.

### Library dev loop

- `yarn dev` (root) runs Rollup watch for `scenes` + `scenes-react` and a webpack watch for `scenes-app`. When developing the libraries this is the main loop, and the demo app rebuilds with library changes.
- Don't run `yarn build` while `yarn dev` is running: both write the same `dist/` folders, and the demo app's watcher can pick up half-written library output and fail until its next rebuild.
