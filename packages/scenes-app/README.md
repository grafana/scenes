# Grafana Scenes App Plugin Demos

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested datasources and panel plugins.

## What is @grafana/scenes

[@grafana/scenes](../scenes/README.md) is a framework to enable versatile app plugins implementation. It provides an easy way to build apps that resemble Grafana's dashboarding experience, including template variables support, versatile layouts, panels rendering and more.

To learn more about @grafana/scenes please refer to [Scenes documentation](https://grafana.github.io/scenes)

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

   or

   1. copy manually the demo app provisioning yaml into `grafana/conf/provisioning/plugins`, i.e.

      ```shell
      cp ./provisioning/plugins/app.yaml ../../../grafana/conf/provisioning/plugins/grafana-scenes-app.yaml
      ```

   2. Creates a symlink folder from `~/scenes/packages/scenes-app/dist` to `~/grafana/data/plugins/grafana-scenes-app/dist` in order to load the scenes demo app compiled assets inside Grafana.

2. Use [provided datasource provisioning](./provisioning/datasources/default.yaml) file to setup required data source in Grafana. Copy manually this file into `grafana/conf/provisioning/datasources`, i.e.

   ```shell
   cp ./provisioning/datasources/default.yaml ../../../grafana/conf/provisioning/datasources/grafana-scenes-app.yaml
   ```

   but if you want to setup also the `gdev-prometheus` datasource used on the demo app, you can follow the instructions [here](https://github.com/grafana/grafana/blob/HEAD/contribute/developer-guide.md#add-data-sources).
   As the `gdev-prometheus` data source require a database to run in the background, you should also run next command to start a Prometheus server:

   ```bash
   make devenv sources=prometheus
   ```

3. From `packages/scenes-app` run `yarn dev`
4. Navigate to [http://localhost:3000/a/grafana-scenes-app/](http://localhost:3001/a/grafana-scenes-app/)

For more details, checkout `package.json`, `docker-compose.yaml`, and the provisioning directory.
