<div align="center">
  <img
    src="https://raw.githubusercontent.com/grafana/scenes/main/docusaurus/website/static/img/logo.svg"
    alt="Grafana Logo"
    width="100px"
    padding="40px"
  />
  <h1>@grafana/scenes-react</h1>
  <p>Build highly interactive Grafana apps with ease.</p>
</div>

## About @grafana/scenes-react

This is a work-in-progress library that makes it easier develop Grafana scene applications using more familiar React patterns like context, hooks and components.

For library documentation go to [https://grafana.com/developers/scenes](https://grafana.com/developers/scenes).

### Setting up local version of @grafana/scenes-react with app plugin

1. Run `YARN_IGNORE_PATH=1 yarn link` from `packages/scenes-react` directory.
1. Run `yarn dev` from repo root directory.
1. Run `yarn link @grafana/scenes-react` from app plugin directory.
1. Start app plugin development server.

### Demo app

Alternatively, use the [demo app](../scenes-app/README.md) included in this repository.
