---
id: scene-app-drilldown
title: Drill-down pages in Scenes apps
---

Drill-down pages are a powerful tool for building complex, data-driven applications. They allow you to create a high-level overview of the data that a user can interact with and progressively explore to reveal underlying data.

## Add drill-down pages to Scenes apps

`SceneAppPage` comes with an API that allows creating deep, nested drilldown views.

:::info
This guide requires knowledge about React Router URL params, Grafana field configuration and data links.
:::

To create a drilldown view for `SceneAppPage`, use `drilldown` property of the `SceneAppPage` object.

### Step 1. Create a Scenes app

Follow [Building apps with scenes guide](./scene-app.md) to build your app.

### Step 2. Build top level drilldown page

On this page, we'll show a summary of the average duration of HTTP requests for Prometheus API endpoints using Grafana's Table panel.

```ts
function getOverviewScene() {
  const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange(),
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: 'sort_desc(avg by(handler) (rate(prometheus_http_request_duration_seconds_sum {}[5m]) * 1e3))',
        format: 'table',
        instant: true,
      },
    ],
  });

  const tablePanel = new VizPanel({
    $data: queryRunner,
    title: 'Average duration of HTTP request',
    pluginId: 'table',
  });

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: tablePanel,
        }),
      ],
    }),
  });
}

function getSceneApp() {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'HTTP handlers overview',
        url: '/a/<PLUGIN_ID>/my-app',
        getScene: getOverviewScene,
      }),
    ],
  });
}
```

### Step 2. Set up drill-down navigation

To show the drill-down page, we need to provide navigation. Configure Table panel data links (learn about data links in [official Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-data-links/)). Then modify the Table panel configuration to set up a data link for the `handler` field.

```tsx
import { urlUtil } from '@grafana/data';
import { locationService } from '@grafana/runtime';

// ...

const tablePanel = new VizPanel({
  $data: queryRunner,
  title: 'Average duration of HTTP request',
  pluginId: 'table',
  fieldConfig: {
    defaults: {},
    overrides: [
      {
        matcher: {
          id: 'byName',
          options: 'handler',
        },
        properties: [
          {
            id: 'links',
            value: [
              {
                title: 'Go to handler overview',
                onBuildUrl: () => {
                  // Use @grafana/runtime location service to get current query params
                  const params = locationService.getSearchObject();

                  // Use @grafana/data urlUtil to render drilldown URL with query params.
                  return urlUtil.renderUrl('/a/<PLUGIN_ID>/my-app/${__value.text:percentencode}', params);
                },
              },
            ],
          },
        ],
      },
    ],
  },
});
```

The above panel will have links for all values of the `handler` field. Clicking on a value will redirect to a particular endpoint drill-down URL that will show a "Not found page" error. We'll set up this page in the next step.

:::note
The `fieldConfig` options are the same options you would see in your normal dashboard panels when you view `Panel JSON` from the Table panel inspect drawer. To access panel inspect drawer, click **Inspect** in the panel edit menu.
:::

:::info
Using `locationService` and `urlUtil` comes handy if you want to preserve variables and time range query params.
`${__value.text:percentencode}` is the percent-encoded value of the clicked table cell.
:::

### Step 3. Build drilldown page

Modify the `getSceneApp` function to set up drilldown scenes. Use the `drilldowns` property of the `SceneAppPage` object. The `drilldowns` property accepts an array of `SceneAppDrilldownView` objects. It allows drilldown URL and page to be rendered configuration:

```ts
export interface SceneAppDrilldownView {
  /** Use to provide parametrized drilldown URL, i.e. /app/clusters/:clusterId **/
  routePath: string;
  /** Function that returns a page object for a given drilldown route match. Use parent to configure drilldown view parent SceneAppPage via getParentPage method. **/
  getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) => SceneAppPageLike;
}
```

Configure the API endpoint drilldown view:

```tsx
function getSceneApp() {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'HTTP handlers overview',
        url: '/a/<PLUGIN_ID>/my-app',
        getScene: getOverviewScene,
        drilldowns: [
          {
            routePath: '/a/<PLUGIN_ID>/my-app/:handler',
            getPage: getHandlerDrilldownPage,
          },
        ],
      }),
    ],
  });
}
```

Define a function that will return a `SceneAppPage` for a drilldown view. This function receives two arguments:

- `routeMatch` - contains information about URL params.
- `parentPage` - contains reference to the parent `SceneAppPage` required to configure breadcrumbs correctly.

```ts
function getHandlerDrilldownPage(routeMatch: SceneRouteMatch<{ handler: string }>, parent: SceneAppPageLike) {
  // Retrieve handler from the URL params.
  const handler = decodeURIComponent(routeMatch.params.handler);

  return new SceneAppPage({
    // Setup particular handler drilldown URL
    url: `/a/<PLUGIN_ID>/my-app/${encodeURIComponent(handler)}`,
    // Important: setup this for breadcrumbs to be built
    getParentPage: () => parent,
    title: `${handler} endpoint overview`,
    getScene: () => getHandlerDrilldownScene(handler),
  });
}
```

### Step 4. Build drilldown scene

Define a scene that will be rendered on the drilldown page:

```ts
function getHandlerDrilldownScene(handler: string) {
  const requestsDuration = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: `avg without(job, instance) (rate(prometheus_http_request_duration_seconds_sum{handler="${handler}"}[5m])) * 1e3`,
      },
    ],
  });

  const requestsCount = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: `sum without(job, instance) (rate(prometheus_http_request_duration_seconds_count{handler="${handler}"}[5m])) `,
      },
    ],
  });

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: new VizPanel({
            $data: requestsDuration,
            title: 'Requests duration',
            pluginId: 'timeseries',
          }),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: new VizPanel({
            $data: requestsCount,
            title: 'Requests count',
            pluginId: 'timeseries',
          }),
        }),
      ],
    }),
  });
}
```

### Complete example

Below you will find the complete code for the scene app with drilldowns:

```tsx
import { urlUtil } from '@grafana/data';
import { locationService } from '@grafana/runtime';

function getOverviewScene() {
  const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange(),
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: 'sort_desc(avg by(handler) (rate(prometheus_http_request_duration_seconds_sum {}[5m]) * 1e3))',
        format: 'table',
        instant: true,
      },
    ],
  });

  const tablePanel = new VizPanel({
    $data: queryRunner,
    title: 'Average duration of HTTP request',
    pluginId: 'table',
    fieldConfig: {
      defaults: {},
      overrides: [
        {
          matcher: {
            id: 'byName',
            options: 'handler',
          },
          properties: [
            {
              id: 'links',
              value: [
                {
                  title: 'Go to handler overview',
                  onBuildUrl: () => {
                    // Use @grafana/runtime location service to get current query params
                    const params = locationService.getSearchObject();

                    // Use @grafana/data urlUtil to render drilldown URL with query params.
                    return urlUtil.renderUrl('/a/<PLUGIN_ID>/my-app/${__value.text:percentencode}', params);
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: tablePanel,
        }),
      ],
    }),
  });
}

function getHandlerDrilldownPage(routeMatch: SceneRouteMatch<{ handler: string }>, parent: SceneAppPageLike) {
  // Retrieve handler from the URL params.
  const handler = decodeURIComponent(routeMatch.params.handler);

  return new SceneAppPage({
    // Setup particular handler drilldown URL
    url: `/a/<PLUGIN_ID>/my-app/${encodeURIComponent(handler)}`,
    // Important: setup this for breadcrumbs to be built
    getParentPage: () => parent,
    title: `${handler} endpoint overview`,
    getScene: () => getHandlerDrilldownScene(handler),
  });
}

function getHandlerDrilldownScene(handler: string) {
  const requestsDuration = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: `avg without(job, instance) (rate(prometheus_http_request_duration_seconds_sum{handler="${handler}"}[5m])) * 1e3`,
      },
    ],
  });

  const requestsCount = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: `sum without(job, instance) (rate(prometheus_http_request_duration_seconds_count{handler="${handler}"}[5m])) `,
      },
    ],
  });

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: new VizPanel({
            $data: requestsDuration,
            title: 'Requests duration',
            pluginId: 'timeseries',
          }),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: new VizPanel({
            $data: requestsCount,
            title: 'Requests count',
            pluginId: 'timeseries',
          }),
        }),
      ],
    }),
  });
}

function getSceneApp() {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'HTTP handlers overview',
        url: '/a/<PLUGIN_ID>/my-app',
        getScene: getOverviewScene,
        drilldowns: [
          {
            routePath: '/a/<PLUGIN_ID>/my-app/:handler',
            getPage: getHandlerDrilldownPage,
          },
        ],
      }),
    ],
  });
}
```
