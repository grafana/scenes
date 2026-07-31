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
- Non-obvious version requirement: run the LATEST `grafana/grafana-dev` (i.e. `main`) build, and override the committed default. The default `GRAFANA_VERSION` in `docker-compose.yaml` (`11.1.0-181853`) is too old — the app's build externalizes `react/jsx-runtime`, which Grafana only exposes as a shared plugin dependency starting in Grafana 13. On older versions the app shows "App not found" with a `react/jsx-runtime` 404. Note the newest STABLE release (`grafana/grafana:latest`, currently 12.4.x) is also still too old for the same reason, so use `grafana-dev`, which has no floating `latest` tag — pick the newest build-numbered tag. Example (13.1.0 `main` build):
  `cd packages/scenes-app && sudo GRAFANA_VERSION=13.1.0-25957875840 docker compose up -d --build`
  To always grab the newest `grafana-dev` tag automatically:
  `GRAFANA_VERSION=$(curl -s "https://hub.docker.com/v2/repositories/grafana/grafana-dev/tags/?page_size=50&ordering=last_updated" | python3 -c "import sys,json,re; print(next(t['name'] for t in json.load(sys.stdin)['results'] if re.match(r'^\d+\.\d+\.\d+-\d+$', t['name'])))")`
- Non-obvious build requirement: serve a PRODUCTION plugin build. `dist/` is bind-mounted into Grafana; run `yarn build` so `packages/scenes-app/dist/module.js` is a production bundle. A development build (`yarn dev`) sets `NODE_ENV=development`, and `@grafana/i18n`'s `t()` (called at module scope inside the scenes library, e.g. `formatRegistry`) THROWS "t() was called before i18n was initialized" in development, so demo sub-routes like `/demos` crash with "Plugin failed to load". Production only warns and falls back, so all demos render.
- After changing `dist/`, the volume is live; hard-reload the browser (Ctrl+Shift+R) since Grafana caches plugin modules.

### Library dev loop
- `yarn dev` (root) runs Rollup watch for `scenes` + `scenes-react` and a webpack watch for `scenes-app`. When developing the libraries this is the main loop; to also VIEW the demo app while iterating, rebuild `scenes-app` in production (`yarn build` or `yarn workspace scenes-app build`) because of the development-mode i18n throw described above.
