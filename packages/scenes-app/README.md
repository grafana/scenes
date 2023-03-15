# Grafana Scenes App Plugin Template

This application demonstrates how to build a basic app plugin using [@grafana/scenes](../scenes/README.md) framework.

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested datasources and panel plugins.

## What is @grafana/scenes

[@grafana/scenes](../scenes/README.md) is a framework to enable versatile app plugins implementation. It provides an easy way to build apps that resemble Grafana's dashboarding experience, including template variables support, versatile layouts, panels rendering and more.

To learn more about @grafana/scenes usage please refer to [Scenes getting started guide](https://github.com/grafana/scenes-get-started)

## What does this template contain?

1. An example of a simple scene. See [Home scene](./src/pages/Home/Home.tsx)
1. An example of a scene with tabs. See [Scene with tabs](./src/pages/WithTabs/WithTabs.tsx)
1. An example of a scene with drill down. See [Scene with drill down](./src/pages/WithDrilldown/WithDrilldown.tsx)

## How to run this app?

### Using provided docker compose

1. From Grafana Scenes root directory run `yarn install`
1. From Grafana Scenes root directory run `./scripts/demo.sh`
1. Navigate to [http://localhost:3001/a/grafana-scenes-app](http://localhost:3001/a/grafana-scenes-app)

### Using local Grafana instance

1. Modify Grafana config to load demo app plugin, i.e.

   ```ini
   # Grafana custom.ini
   [plugin.grafana-scenes-app]
   path=<your-path>/grafana-scenes/packages/scenes-app
   ```

1. Use [provided datasource provisioning](./provisioning//datasources/default.yaml) file to setup required data source.
1. From `packages/scenes-app` run `yarn dev`
1. Navigate to [http://localhost:3000/a/grafana-scenes-app/](http://localhost:3001/a/grafana-scenes-app/)

For more details, checkout `package.json`, `docker-compose.yaml`, and the provisioning directory.
