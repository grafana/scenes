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

### Working with Grafana

@grafana/scenes does not come with dedicated playground yet. It is currently possible to run Scene demos using Grafana. To do that, the following setup is required.

1. Clone @grafana/scenes repository.
1. Clone [Grafana](https://github.com/grafana/grafana/) repository and follow [Development guide](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md#developer-guide).
1. Setup env variable `GRAFANA_PATH` to point to your Grafana repository directory, `export GRAFANA_PATH=<path-to-grafana-directory>`
1. From @grafana/scenes directory run `./scripts/dev.sh`. This will compile @grafana/scenes with watch mode enabled and link it to your Grafana.
1. From Grafana directory run `yarn install`.
1. Start Grafana with `scenes` [feature toggle enabled](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#feature_toggles)
1. Navigate to `http://localhost:3000/scenes` to explore demo scenes.

### Working with Grafana app plugin

1. Run `YARN_IGNORE_PATH=1 yarn link` from @grafana/scenes directory.
1. Run `yarn dev` from @grafana/scenes directory.
1. Run `yarn link @grafana/scenes` from app plugin directory.
1. Start app plugin development server.
