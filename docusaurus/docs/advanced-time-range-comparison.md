---
id: advanced-time-range-comparison
title: Time range comparison
---

Scenes come with `SceneTimeRangeCompare` object that allows running a `SceneQueryRunner` queries with a time range that is different from the one provided by `SceneTimeRange` object. With `SceneTimeRangeCompare` object you can set what comparison time window you want your queries to be performed against. This allows data from a second time range to be shown on a visualization.

## Use `SceneTimeRangeCompare` in a Scene

1. Create a scene with time range and query runner

Start by creating a scene that contains a `SceneTimeRange` and a `SceneQueryRunner`:

```tsx
const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'A',
      expr: 'rate(prometheus_http_requests_total{}[5m])',
    },
  ],
});

const scene = new EmbeddedScene({
  $data: queryRunner,
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  body: new SceneFlexLayout({
    direction: 'row',
    children: [
      new SceneFlexItem({
        width: '50%',
        height: 300,
        body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
      }),
    ],
  }),
});
```

2. Add time picker to scene controls

Use `SceneTimePicker` object to display and control time range of a scene:

```tsx
const scene = new EmbeddedScene({
  $data: queryRunner,
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  controls: [new SceneTimePicker({})]
  body: new SceneFlexLayout({
    direction: 'row',
    children: [
      new SceneFlexItem({
        width: '50%',
        height: 300,
        body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
      }),
    ],
  }),
});
```

3. Add time window comparison picker to scene controls

Create a `SceneTimeRangeCompare` scene object and add it next to `SceneTimePicker` in scene's controls:

```tsx
const scene = new EmbeddedScene({
  $data: queryRunner,
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  controls: [new SceneTimePicker({}), new SceneTimeRangeCompare({})],
  body: new SceneFlexLayout({
    direction: 'row',
    children: [
      new SceneFlexItem({
        width: '100%',
        height: '100%',
        body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
      }),
    ],
  }),
});
```

A time frame comparison picker should be shown next to time range picker. Enable time range comparison by clicking on the **Time frame comparison** checkbox and pick time window to compare the currently selected time range with.

## Customize style of a comparison series

You can customize the style of a comparison series rendered on a visualization by [configuring overrides](./visualizations.md#step-7-configure-overrides). Use `matchComparisonQuery(queryRefId: string)` matcher to target comparison query results:

```tsx
const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'MyQuery',
      expr: 'rate(prometheus_http_requests_total{}[5m])',
    },
  ],
});

const panelShowingComparisonSeries = PanelBuilders.timeseries()
  .setData(queryRunner)
  .setOverrides((b) =>
    b.matchComparisonQuery('MyQuery').overrideColor({
      mode: 'fixed',
      fixedColor: 'red',
    })
  );
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-time-range-comparison.tsx)
