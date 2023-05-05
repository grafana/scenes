---
id: scene-app-tabs
title: Tabs navigation to scene app
---

`SceneAppPage` provides support for building Grafana applications with tabs navigation. Tabs navigation is especially useful for designing information architecture for complex Grafana apps, where visualizations are groupped into meaningful sections.

## Add tabs navigation to scene app

Defining tabs navigation for apps using scenes is a matter of utilizing `SceneAppPage` property `tabs`.

### Step 1. Create SceneApp

Follow [Building apps with scenes guide](./scene-app.md) to build your app.

### Step 2. Create scenes for individual tabs

Each tab renders its own scene, similar to `SceneAppPage`.

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
        body: new VizPanel({
          title: 'HTTP Requests per handler',
          pluginId: 'timeseries',
        })
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
        body: new VizPanel({
          title: 'HTTP Requests per handler',
          pluginId: 'table',
        })
      })],
    }),
  });
}
```

### Step 3. Configure tabs for page

Tabs are instances of `SceneAppPage` objects. Similarily to creating scene page, you create tabs. To render tabs, use `tabs` property of the `SceneAppPage` object.

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

Navigating to `https://your-grafana.url/a/<PLUGIN_ID>/my-app` will render a scene app with two tabs: Overview and Handlers. Overview tab contains Time series panel with Prometheus HTTP Requests summary. Handlers tab contains table panel with Prometheus HTTP request average durration summary per handler.
