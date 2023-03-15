<div align="center">
  <img
    src="../../docs/img/grafana_icon.svg"
    alt="Grafana Logo"
    width="100px"
    padding="40px"
  />
  <h1>@grafana/scenes</h1>
  <p>Create dashboard-like experiences in Grafana app plugins</p>
</div>

## About @grafana/scenes

@grafana/scenes provides a framework to build dashboard-like experiences within Grafana's app plugins. It comes with the following features:

- Versatile layout options.
- Grafana panels rendering.
- Querying & transformations support
- Multiple time ranges support.
- Template variables support.
- URL sync.
- ... and more.

## Development

To work on @grafana/scenes SDK, please follow the guides below.

### Setting up local version of @grafana/scenes with local Grafana instance

It is currently possible to run Scene demos using Grafana. To do that, the following setup is required.

1. Clone [Grafana Scenes repository](https://github.com/grafana/grafana/).
1. Clone [Grafana](https://github.com/grafana/grafana/) repository and follow [Development guide](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md#developer-guide).
1. Setup env variable `GRAFANA_PATH` to point to your Grafana repository directory, `export GRAFANA_PATH=<path-to-grafana-directory>`
1. From Grafana Scenes root directory run `./scripts/dev.sh`. This will compile @grafana/scenes with watch mode enabled and link it to your Grafana.
1. From Grafana directory run `yarn install`.
1. Start Grafana with `scenes` [feature toggle enabled](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#feature_toggles)
1. Navigate to `http://localhost:3000/scenes` to explore demo scenes.

### Setting up local version of @grafana/scenes with app plugin

1. Run `YARN_IGNORE_PATH=1 yarn link` from `packages/scenes` directory.
1. Run `yarn dev` from `packages/scenes` directory.
1. Run `yarn link @grafana/scenes` from app plugin directory.
1. Start app plugin development server.
