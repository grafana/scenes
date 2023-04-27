---
id: advanced-activation-handlers
title: Activation handlers
---

Activation handlers are useful tool for providing external behaviors to scene objects. When a scene object is mounted, activation handlers are called.

Activation handlers, similar to React's `useEffect`, return a function(deactivation handler), that should be used to clean up all behaviors added in activation handler. Deactivation handler is called when a scene object is unmounted.

:::info
Activation handlers are especially usefull if you want to add external behaviors to core scene objects. They reduce a need for implementing custom scene objects that would handle scene objects connections.
:::

## Adding activation handler

### Step 1. Create a scene

Start with creating a scene that renders a single timeseries panel:

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

### Step 2. Add activation handler

Add activation handler to SceneQueryRunner that subscribe to state changes and log current state. Keep in mind that subscription to state will not be created until SceneQueryRunner is activated:

```ts
queryRunner.addActivationHandler(() => {
  const sub = queryRunner.subscribeToState((state) => {
    console.log('queryRunner state', state);
  });
});
```

### Step 3. Return deactivation handler

From the activation handler, return a function that will unsubscribe from `queryRunner` state changes when object is de-activated:

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
