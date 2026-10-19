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

The docker setup runs `grafana/grafana:13.2.4` together with a Prometheus instance that backs the `gdev-prometheus` data source used by some of the demos. To run a different Grafana build, set `GRAFANA_IMAGE` and `GRAFANA_VERSION`, i.e. `GRAFANA_IMAGE=grafana-dev GRAFANA_VERSION=<build-tag> ./scripts/demo.sh`.

### Using local Grafana instance

Set up the Grafana repository for development first by following the [Grafana developer guide](https://github.com/grafana/grafana/blob/HEAD/contribute/developer-guide.md), including running `yarn install` in it. The commands below assume the `grafana` and `scenes` repositories are cloned next to each other.

1. From Grafana Scenes root directory build the scenes packages and the demo app:

   ```shell
   yarn install
   yarn build
   ```

   The demo app is compiled against the local `@grafana/scenes` and `@grafana/scenes-react` packages, so they have to be built at least once before it. To rebuild everything when files change, also run `yarn dev` and keep it running.

2. Modify Grafana config to load demo app plugin, i.e.

   ```ini
   # Grafana custom.ini
   [plugin.grafana-scenes-app]
   path=<your-path>/scenes/packages/scenes-app
   ```

   Alternatively, instead of changing the config, create a symlink from `~/scenes/packages/scenes-app/dist` to `~/grafana/data/plugins/grafana-scenes-app/dist`.

3. Set up the `gdev-testdata` and `gdev-prometheus` data sources used by the demos:

   - If you have set up the Grafana development data sources (see [Add data sources](https://github.com/grafana/grafana/blob/HEAD/contribute/developer-guide.md#add-data-sources)), both data sources already exist. From Grafana root directory run `make devenv sources=prometheus` to start the Prometheus server behind `gdev-prometheus`.
   - Otherwise, from `packages/scenes-app` copy the [provided data source provisioning](./provisioning/datasources/default.yaml) file, which sets up `gdev-testdata` only:

     ```shell
     cp ./provisioning/datasources/default.yaml ../../../grafana/conf/provisioning/datasources/grafana-scenes-app.yaml
     ```

     Don't copy it when the Grafana development data sources are set up: both files mark `gdev-testdata` as the default data source and Grafana fails to start.

4. From Grafana root directory start Grafana, running each command in its own terminal:

   - `yarn start` builds the Grafana frontend and rebuilds it when its files change. Grafana's UI needs a built frontend, so run it the first time and whenever you work on Grafana frontend code, and wait for the first build to finish before opening Grafana.
   - `make run` builds and starts the Grafana backend on [http://localhost:3000](http://localhost:3000). Start it after step 1: Grafana reads the demo app's `plugin.json` only on startup, so restart it if `plugin.json` changes. Changes to the demo app code only need a browser reload.

5. Enable the app. Sign in to Grafana (`admin`/`admin` by default), go to **Administration** > **Plugins and data** > **Plugins**, search for `Scenes Test App`, open it and click **Enable**. The app is then listed in the navigation under **More apps**.

   To enable the app on startup instead, from `packages/scenes-app` copy the provided plugin provisioning file before running `make run`:

   ```shell
   cp ./provisioning/plugins/app.yaml ../../../grafana/conf/provisioning/plugins/grafana-scenes-app.yaml
   ```

6. Navigate to [http://localhost:3000/a/grafana-scenes-app](http://localhost:3000/a/grafana-scenes-app)

For more details, checkout `package.json`, `docker-compose.yaml`, and the provisioning directory.
