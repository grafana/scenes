---
id: scene-layout
title: Building Scene layout
---

Scenes support two layout types: flex and grid layout. In this guide you will learn how to use and configure `SceneFlexLayout` and `SceneGridLayout`.

## Flexbox layout

`SceneFlexLayout` allows building flexible scenes with layout driven by browser's CSS flexbox layout. This allows for defining very dynamic layouts where panel widths and heights can adapt to the available space. 

### Step 1. Create a scene

Start using flexbox layout by creating a scene with `body` configured as `SceneFlexLayout`:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({}),
});
```

### Step 2. Configure flexbox layout

`SceneFlexLayout` allows flexbox behavior configuration. You can configuere the following properties:

- `direction` - configure the main axis of flexbox layout. Children placed within the layout will follow it's direction.
- `wrap` - configure behavior of layout children. By default, children will try to fit into one line.

By default SceneFlexLayout uses `row` direction. To create colum layout, try the following code:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({
    direction: 'column',
  }),
});
```

### Step 3. Add layout children

`SceneFlexLayout` has `children` property. It accepts an array of `SceneFlexItem` or `SceneFlexLayout` objects.
Create scene with two, equally sized layout items in a column:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({
    direction: 'column',
    children: [new SceneFlexItem({}), new SceneFlexItem({})],
  }),
});
```

Both `ScenFlexLayout` and `SceneFlexItem` object types accept the following configuration options that allow setting up placement of a layout item:

```ts
  flexGrow?: CSSProperties['flexGrow'];
  alignSelf?: CSSProperties['alignSelf'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minWidth?: CSSProperties['minWidth'];
  minHeight?: CSSProperties['minHeight'];
  maxWidth?: CSSProperties['maxWidth'];
  maxHeight?: CSSProperties['maxHeight'];
  xSizing?: 'fill' | 'content';
  ySizing?: 'fill' | 'content';
```

### Step 4. Add panels to flex layout items

The above example sets up layout for your scene. To visualize data, [configure `SceneQueryRunner`](./core-concepts.md#data-and-time-range) and add it to your scene first:

```ts
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

const myScene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneFlexLayout({
    direction: 'column',
    children: [new SceneFlexItem({}), new SceneFlexItem({})],
  }),
});
```

Next, add `VizPanel` objects as `body` of layout items:

```ts
const queryRunner = new SceneQueryRunner({
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

const myScene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          pluginId: 'timeseries',
          title: 'Time series',
        }),
      }),
      new SceneFlexItem({
        body: new VizPanel({
          pluginId: 'table',
          title: 'Table',
        }),
      }),
    ],
  }),
});
```

The above example will render two panels, a Timeseries and a Table panel.

## Grid layout

`SceneGridLayout` allows building scenes as grids. This is the default behavior of Dashboards in Grafana, and grid layout enables adding a similar experience to your scene.

### Step 1. Create a scene

Start using grid layout by creating a scene with `body` configured as `SceneGridLayout`:

```ts
const myScene = new EmbeddedScene({
  body: new SceneGridLayout({}),
});
```

### Step 2. Configure grid layout

`SceneGridLayout` allows grid behavior configuration. The provided grid has 24 columns.

You can configure the following properties:

- `isDraggable` - configure whether or not grid items can be moved.
- `isLazy` - configure whether or not grid items should be initialized when they are outside of the viewport.

```ts
const myScene = new EmbeddedScene({
  body: new SceneGridLayout({
    isDraggable: false,
    isLazy: true,
  }),
});
```

### Step 3. Add layout children

`SceneGridLayout` has `children` property. It accepts an array of `SceneGridItem` or `SceneGridRow` objects.
Create scene with two grid item in a row:

```ts
const myScene = new EmbeddedScene({
  body: new SceneGridLayout({
    children: [
      new SceneGridItem({
        x: 0,
        y: 0,
        width: 12,
        height: 10,
        isResizable: false,
        isDraggable: false,
      }),
      new SceneGridItem({
        x: 12,
        y: 0,
        width: 12,
        height: 10,
        isResizable: false,
        isDraggable: false,
      }),
    ],
  }),
});
```

`SceneGridItem` accepts the following configuration options. Options are expressed in 24 columns grid units.

```ts
  x?: number;
  y?: number;
  width?: number;
  height?: number;
```

### Step 4. Add panels to grid layout items

[Similarily to flexbox layout](#step-4-add-panels-to-flex-layout-items), add `VizPanel` to `SceneGridItem` to show visualized data:

```ts
const myScene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneGridLayout({
    children: [
      new SceneGridItem({
        x: 0,
        y: 0,
        width: 12,
        height: 10,
        isResizable: false,
        isDraggable: false,
        body: new VizPanel({
          pluginId: 'timeseries',
          title: 'Time series',
        }),
      }),
      new SceneGridItem({
        x: 12,
        y: 0,
        width: 12,
        height: 10,
        isResizable: false,
        isDraggable: false,
        body: new VizPanel({
          pluginId: 'table',
          title: 'Table',
        }),
      }),
    ],
  }),
});
```

### Step 5. Add a grid row

Grid row is a layout item that groups other `SceneGridItems` into a collapsible row. Use `SceneGridRow` add a row to Scene:

:::note
In `SceneGridRow` the `x` and `y` coordinates are relative to the row.
:::

```ts
const row = new SceneGridRow({
  x: 0,
  y: 0,
  children: [
    new SceneGridItem({
      x: 0,
      y: 0,
      width: 12,
      height: 10,
      isResizable: false,
      isDraggable: false,
      body: new VizPanel({
        pluginId: 'timeseries',
        title: 'Time series',
      }),
    }),
    new SceneGridItem({
      x: 12,
      y: 0,
      width: 12,
      height: 10,
      isResizable: false,
      isDraggable: false,
      body: new VizPanel({
        pluginId: 'table',
        title: 'Table',
      }),
    }),
  ],
});

const myScene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneGridLayout({
    children: [row],
  }),
});
```
