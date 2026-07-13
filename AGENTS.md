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
