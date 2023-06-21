---
id: advanced-activation-handlers
title: Activation handlers
---

Activation handlers are useful tool for providing external behaviors to scene objects. When a scene object is mounted, activation handlers are called.

Similarly to React's `useEffect`, activation handlers return a `function(deactivation handler)` that should be used to clean up all behaviors added in an activation handler. A deactivation handler is called when a scene object is unmounted.

:::note
Activation handlers are especially useful if you want to add external behaviors to core scene objects. They reduce the need for implementing custom scene objects that would handle scene object connections.
:::

This topic describes how to create and use activation handlers.

## Add activation handlers

Follow these steps to create an activation handler.

### Step 1. Create a scene

Start by creating a scene that renders a time series panel and a text panel:

```ts
const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  queries: [
    {
      refId: 'A',
      range: true,
      format: 'time_series',
      expr: 'rate(prometheus_http_requests_total[5m])',
    },
  ],
});

const timeSeriesPanel = PanelBuilders.timeseries().setTitle('Panel title').setData(queryRunner).build();
const debugView = PanelBuilders.text()
  .setTitle('Debug view')
  .setOption('mode', TextMode.HTML)
  .setOption('content', '')
  .build();

const scene = new EmbeddedScene({
  $timeRange: new SceneTimeRange(),
  controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: timeSeriesPanel,
      }),
      new SceneFlexItem({
        width: '30%',
        body: debugView,
      }),
    ],
  }),
});
```

### Step 2. Add an activation handler

Add an activation handler to `SceneQueryRunner` that subscribes to state changes and shows the executed query in the text panel. Keep in mind that a subscription to state won't be created until `SceneQueryRunner` is activated:

```ts
queryRunner.addActivationHandler(() => {
  let log = '';

  const sub = queryRunner.subscribeToState((state) => {
    log =
      `${new Date(Date.now()).toLocaleTimeString()} Executed query: <pre>${state.queries.map((q) => q.expr)}</pre>\n` +
      log;
    debugView.setState({
      options: {
        content: log,
      },
    });
  });
});
```

### Step 3. Return a deactivation handler

From the activation handler, return a function that will unsubscribe from `queryRunner` state changes when the object is deactivated:

```ts
queryRunner.addActivationHandler(() => {
  let log = '';

  const sub = queryRunner.subscribeToState((state) => {
    log =
      `${new Date(Date.now()).toLocaleTimeString()} Executed query: <pre>${state.queries.map((q) => q.expr)}</pre>\n` +
      log;
    debugView.setState({
      options: {
        content: log,
      },
    });
  });

  // Return deactivation handler
  return () => {
    sub.unsubscribe();
  };
});
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-activation-handlers.tsx)
