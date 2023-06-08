---
id: advanced-activation-handlers
title: Activation handlers
hide_title: true
weight: 200
---

# Activiation handlers

Activation handlers are useful tool for providing external behaviors to scene objects. When a scene object is mounted, activation handlers are called.

Similarly to React's `useEffect`, activation handlers return a `function(deactivation handler)` that should be used to clean up all behaviors added in an activation handler. A deactivation handler is called when a scene object is unmounted.

> **Note:** Activation handlers are especially useful if you want to add external behaviors to core scene objects. They reduce the need for implementing custom scene objects that would handle scene object connections.

This topic describes how to create and use activation handlers.

## Add activation handlers

Follow these steps to create an activation handler.

### Step 1. Create a scene

Start by creating a scene that renders a single time series panel:

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
      expr: 'rate(prometheus_http_requests_total{handler="$handler"}[5m])',
    },
  ],
});

const scene = new EmbeddedScene({
  $timeRange: new SceneTimeRange(),
  controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        minWidth: '70%',
        body: new VizPanel({
          pluginId: 'timeseries',
          title: 'Dynamic height and width',
          $data: queryRunner,
        }),
      }),
    ],
  }),
});
```

### Step 2. Add an activation handler

Add an activation handler to `SceneQueryRunner` that subscribes to state changes and logs the current state. Keep in mind that a subscription to state won't be created until `SceneQueryRunner` is activated:

```ts
queryRunner.addActivationHandler(() => {
  const sub = queryRunner.subscribeToState((state) => {
    console.log('queryRunner state', state);
  });
});
```

### Step 3. Return a deactivation handler

From the activation handler, return a function that will unsubscribe from `queryRunner` state changes when the object is deactivated:

```ts
queryRunner.addActivationHandler(() => {
  const sub = queryRunner.subscribeToState((state) => {
    console.log('queryRunner state', state);
  });

  // Return deactivation handler
  return () => {
    sub.unsubscribe();
  };
});
```
