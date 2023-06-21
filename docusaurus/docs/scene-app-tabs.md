---
id: scene-app-tabs
title: Tab navigation in Scenes apps
---

`SceneAppPage` provides support for building Grafana applications with tabs navigation. Tabs navigation is especially useful for designing information architecture for complex Grafana apps, where visualizations are grouped into meaningful sections.

## Add tabs navigation to Scenes apps

Defining tabs navigation for apps using Scenes requires you to use the `SceneAppPage` property, `tabs`.

### Step 1. Create a Scenes app

Follow the [Building apps with Scenes guide](./scene-app.md) to build your app.

### Step 2. Create scenes for individual tabs

Each tab renders its own scene, similar to `SceneAppPage`:

```tsx
const getOverviewScene =() => {
    const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange()
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  return new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({
        minHeight: 300,
        body: PanelBuilders.timeseries().setTitle('HTTP Requests per handler').build(),
      })],
    }),
  });
}

const getHandlersScene =() => {
  const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange()
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

    return new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({
        minHeight: 300,
        body: PanelBuilders.table().setTitle('HTTP Requests per handler').build(),
      })],
    }),
  });
}
```

### Step 3. Configure tabs for the page

Tabs are instances of `SceneAppPage` objects. Similar to creating a scene page, you create tabs. To render tabs, use the `tabs` property of the `SceneAppPage` object:

```tsx

const overviewTab = new SceneAppPage({
  title: 'Overview',
  url: '/a/<PLUGIN_ID>/my-app/overview',
  getScene: getOverviewScene,
});

const handlersTab = new SceneAppPage({
  title: 'Handlers',
  url: '/a/<PLUGIN_ID>/my-app/handlers',
  getScene: getHandlersScene,
});


const myAppPage = new SceneAppPage({
  title: 'Grafana Scenes App',
  url: '`/a/<PLUGIN_ID>/my-app`,
  tabs: [
    overviewTab,
    handlersTab
  ]
});
```

Navigating to `https://your-grafana.url/a/<PLUGIN_ID>/my-app` will render a Scenes app with two tabs: **Overview** and **Handlers**. The **Overview** tab contains a time series panel with a Prometheus HTTP Requests summary. The **Handlers** tab contains a table panel with a Prometheus HTTP request average duration summary, per handler.
