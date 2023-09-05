<div align="center">
  <img
    src="https://raw.githubusercontent.com/grafana/scenes/main/docusaurus/website/static/img/logo.svg"
    alt="Grafana Logo"
    width="100px"
    padding="40px"
  />
  <h1>@grafana/scenes</h1>
  <p>Build highly interactive Grafana apps with ease.</p>
</div>

## About @grafana/scenes

@grafana/scenes provides a library to build highly interactive, dashboard-like experiences in Grafana's app plugins. It comes with the following features:

- Versatile layout options.
- Grafana panels rendering.
- Querying & transformations support
- Multiple time ranges support.
- Template variables support.
- URL sync.
- ... and more.

## Development

To work on @grafana/scenes SDK, please follow the guides below.

### Setting up @grafana/scenes with a local Grafana instance

To setup scenes with local Grafana, the following setup is required:

1. Clone the [Grafana Scenes repository](https://github.com/grafana/scenes/).
1. Clone the [Grafana](https://github.com/grafana/grafana/) repository and follow the [Development guide](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md#developer-guide).
1. Setup env variable `GRAFANA_PATH` to point to your Grafana repository directory, `export GRAFANA_PATH=<path-to-grafana-directory>`
1. From Grafana Scenes root directory run `./scripts/dev.sh`. This will compile @grafana/scenes with watch mode enabled and link it to your Grafana.
1. From Grafana directory run `yarn install`.

### Setting up local version of @grafana/scenes with app plugin

1. Run `YARN_IGNORE_PATH=1 yarn link` from `packages/scenes` directory.
1. Run `yarn dev` from `packages/scenes` directory.
1. Run `yarn link @grafana/scenes` from app plugin directory.
1. Start app plugin development server.

### Demo app

Alternatively, use the [demo app](../scenes-app/README.md) included in this repository.
