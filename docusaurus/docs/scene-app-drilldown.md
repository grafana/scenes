---
id: scene-app-drilldown
title: Drill-down pages in Scenes apps
---

Drill-down pages are a powerful tool for building complex, data-driven applications. They allow you to create a high-level overview of the data that a user can interact with and progressively explore to reveal underlying data.

## Add drill-down pages to Scenes apps

`SceneAppPage` comes with an API that allows you to create deep, nested drill-down pages.

:::note
**Before you begin**: You must already know about React Router URL params, Grafana field configuration, and data links before continuing with this guide.
:::

To create a drill-down page, use the `drilldown` property of the `SceneAppPage` object.

### Step 1. Create a Scenes app

Follow the [Building apps with Scenes guide](./scene-app.md) to build your app.

### Step 2. Build a top level drill-down page

Use the code that follows to build a page that shows a summary of the average duration of HTTP requests for Prometheus API endpoints, using Grafana's Table panel:

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

  const tablePanel = PanelBuilders.table().setTitle('Average duration of HTTP request').setData(queryRunner).build();

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

### Step 3. Set up drill-down navigation

To show the drill-down page, you need to provide navigation. Configure Table panel data links (learn about data links in the [official Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-data-links/)). Then modify the Table panel configuration to set up a data link for the `handler` field:

```tsx
import { sceneUtils, PanelBuilders } from '@grafana/scenes';

// ...

const tablePanel = PanelBuilders.table()
  .setTitle('Average duration of HTTP request')
  .setData(queryRunner)
  .setOverrides((b) =>
    b.matchFieldsWithName('handler').overrideLinks([
      {
        title: 'Go to handler overview',
        url: '/a/<PLUGIN_ID>/my-app/${__value.text}${__url.params}',
      },
    ])
  )
  .build();
```

The resulting panel will have links for all values of the `handler` field. Clicking a value will redirect to a particular endpoint drill-down URL that will show a "Not found page" error. You'll set up this page in the next step.

:::note
The `fieldConfig` options are the same options you would see in typical dashboard panels when you view **Panel JSON** from the Table panel inspect drawer. To access panel inspect drawer, click **Inspect** in the panel edit menu.
:::

### Step 4. Build a drill-down page

Modify the `getSceneApp` function to set up drill-down scenes. Use the `drilldowns` property of the `SceneAppPage` object. The `drilldowns` property accepts an array of `SceneAppDrilldownView` objects. It allows a drill-down URL and page to be rendered configuration:

```ts
export interface SceneAppDrilldownView {
  /** Use to provide parametrized drilldown URL, for example, /app/clusters/:clusterId **/
  routePath: string;
  /** Function that returns a page object for a given drilldown route match. Use parent to configure drilldown view parent SceneAppPage via getParentPage method. **/
  getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) => SceneAppPageLike;
}
```

Configure the API endpoint drill-down view:

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

Define a function that returns a `SceneAppPage` for a drill-down view. This function receives two arguments:

- `routeMatch` - Contains information about URL params.
- `parentPage` - Contains a reference to the parent `SceneAppPage` required to configure breadcrumbs correctly.

```ts
function getHandlerDrilldownPage(routeMatch: SceneRouteMatch<{ handler: string }>, parent: SceneAppPageLike) {
  // Retrieve handler from the URL params
  const handler = decodeURIComponent(routeMatch.params.handler);

  return new SceneAppPage({
    // Set up a particular handler drill-down URL
    url: `/a/<PLUGIN_ID>/my-app/${encodeURIComponent(handler)}`,
    // Important: Set this up for breadcrumbs to be built
    getParentPage: () => parent,
    title: `${handler} endpoint overview`,
    getScene: () => getHandlerDrilldownScene(handler),
  });
}
```

### Step 5. Build a drill-down scene

Define a scene that will be rendered on the drill-down page:

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
          body: PanelBuilders.timeseries().setTitle('Requests duration').setData(requestsDuration),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.timeseries().setTitle('Requests count').setData(requestsCount),
        }),
      ],
    }),
  });
}
```

### Complete example

Below you'll find the complete code for a Scenes app with drill-down pages:

```tsx
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

  const tablePanel = PanelBuilders.table()
    .setTitle('Average duration of HTTP request')
    .setData(queryRunner)
    .setOverrides((b) =>
      b.matchFieldsWithName('handler').overrideLinks([
        {
          title: 'Go to handler overview',
          url: '/a/<PLUGIN_ID>/my-app/${__value.text}${__url.params}',
        },
      ])
    )
    .build();

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
          body: PanelBuilders.timeseries().setTitle('Requests duration').setData(requestsDuration),
        }),
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.timeseries().setTitle('Requests count').setData(requestsCount),
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
