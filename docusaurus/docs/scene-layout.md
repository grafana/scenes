---
id: scene-layout
title: Building a scene layout
hide_title: true
---

# Building a scene layout

Scenes support two layout types: flex and grid layout. In this guide, you'll learn how to use and configure `SceneFlexLayout` and `SceneGridLayout`.

## Flexbox layout

`SceneFlexLayout` allows you to build flexible scenes with layouts driven by the browser's CSS flexbox layout. This lets you to define very dynamic layouts where panel widths and heights can adapt to the available space.

### Step 1. Create a scene

Start using the flexbox layout by creating a scene with `body` configured as `SceneFlexLayout`:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({}),
});
```

### Step 2. Configure flexbox layout

`SceneFlexLayout` allows flexbox behavior configuration. You can configure the following properties:

- `direction` - Configures the main axis of flexbox layout. Children placed within the layout follow its direction.
- `wrap` - Configures the behavior of layout children. By default, children try to fit into one line.

By default, `SceneFlexLayout` uses `row` direction. To create a column layout, use the following code:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({
    direction: 'column',
  }),
});
```

### Step 3. Add layout children

`SceneFlexLayout` has a `children` property. It accepts an array of `SceneFlexItem` or `SceneFlexLayout` objects.
Create a scene with two, equally sized layout items in a column:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({
    direction: 'column',
    children: [new SceneFlexItem({ minHeight: 200 }), new SceneFlexItem({ minHeight: 300 })],
  }),
});
```

Both `SceneFlexLayout` and `SceneFlexItem` object types accept the following configuration options that allow size constraints and behaviors:

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
  // For sizing constaints on smaller screens
  md?: SceneFlexItemPlacement;
```

We strongly recommend setting a `minHeight` on all children of the layout that use `column` direction. This ensures that they aren't overly compressed on smaller screens. If you set `minHeight` or `height` on the `SceneFlexLayout` object, you don't need
to set it on each child, as they will inherit these constraints.

### Step 4. Add panels to flex layout items

The preceding example sets up a layout for your scene. To visualize data, [configure `SceneQueryRunner`](./core-concepts.md#data-and-time-range) and add it to your scene:

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

Next, add `VizPanel` objects as the `body` of the layout items:

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

This will render two panels, a Time series and a Table panel.

> **Note:** For `SceneFlexItems` that contain `VizPanel` objects, it's recommended that you set `minHeight` or `minWidth` constraints so the panels aren't overly compressed by limited screen space.

### Responsive flex layouts

By default, `SceneFlexLayout` has some responsive behaviors for smaller screens:

- `SceneFlexLayout` direction changes from `row` to `column`.
- `SceneFlexLayout` `maxWidth`, `maxHeight`, `height` or `width` constraints are removed.
- `SceneFlexLayout` and `SceneFlexItem` uses the `minHeight` or `height` set on the parent layout (unless specified on it directly). This is to force a `height` or `minHeight` constraint set on a `SceneFlexLayout` with direction `row` to also apply to its children so that when the responsive media query that changes the direction to `column` is triggered, these constraints continue acting on the children.

These behaviors are triggered for screens that match the media query of Grafana's theme.breakpoints.down('md').

You can override these behaviors and set custom direction and size constraints using the `md` property that exists on both `SceneFlexLayout` and `SceneFlexItem`. For example:

```ts
new SceneFlexLayout({
  direction: 'row',
  minHeight: 200,
  md: {
    minHeight: 100,
    direction: 'row',
  },
  children: [getStatPanel({}), getStatPanel({})],
}),
```

In the preceding example, we use the `md` property to override the default responsive behavior that changes a row layout to a column layout. We also apply a tighter `minHeight` constraint.

## Grid layout

`SceneGridLayout` allows you to build scenes as grids. This is the default behavior of Dashboards in Grafana, and grid layout lets you add a similar experience to your scene.

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

- `isDraggable` - Configures whether or not grid items can be moved.
- `isLazy` - Configures whether or not grid items should be initialized when they are outside of the viewport.

```ts
const myScene = new EmbeddedScene({
  body: new SceneGridLayout({
    isDraggable: false,
    isLazy: true,
  }),
});
```

### Step 3. Add layout children

`SceneGridLayout` has a `children` property. It accepts an array of `SceneGridItem` or `SceneGridRow` objects.
Create a scene with two grid items in a row:

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

`SceneGridItem` accepts the following configuration options, which are expressed in 24-column grid units:

```ts
  x?: number;
  y?: number;
  width?: number;
  height?: number;
```

### Step 4. Add panels to grid layout items

Add `VizPanel` to `SceneGridItem` to show visualized data:

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

A grid row is a layout item that groups other `SceneGridItems` into a collapsible row. Use `SceneGridRow` to add a row to a scene:

> **Note:** In `SceneGridRow`, the `x` and `y` coordinates are relative to the row.

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
