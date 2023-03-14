<div align="center">
  <img
    src="./docs/img/grafana_icon.svg"
    alt="Grafana Logo"
    width="100px"
    padding="40px"
  />
  <h1>Grafana Scenes</h1>
  <p>Create dashboard-like experiences in Grafana app plugins</p>
</div>

| Package Name    | Description                     | Readme                                  | Version                                                            | Downloads                                             |
| --------------- | ------------------------------- | --------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| @grafana/scenes | Scenes SDK                      | [Link](./packages/scenes/README.md)     | ![npm](https://img.shields.io/npm/v/@grafana/scenes?label=version) | ![npm](https://img.shields.io/npm/dw/@grafana/scenes) |
| Scenes App      | Demo app using Scenes framework | [Link](./packages/scenes-app/README.md) | -                                                                  | -                                                     |

## Important notice

@grafana/scenes is in its early days. We do not encourage anyone to use it in plugins yet. APIs can (and probably will) change significantly in the months to come.

## Development

### Running the demo app

Please refer to [demo app README](./packages/scenes-app/README.md) for more info.

### Developing @grafana/scenes

Please refer to [@grafana/scenes README](./packages/scenes/README.md) for more info.

### Releasing new version

In your branch:

1. Run `yarn lerna version --no-push --no-git-tag-version`.
1. Select version.
1. Commit and push changes.
1. New version will be released when changes are merged to `main`.
