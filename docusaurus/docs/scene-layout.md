---
id: scene-layout
title: Building a scene layout
---

Scenes support two layout types: flex and grid layout. In this guide, you'll learn how to use and configure `SceneFlexLayout` and `SceneGridLayout`.

## Flexbox layout

`SceneFlexLayout` allows you to build flexible scenes with layouts driven by the browser's CSS flexbox layout. This lets you to define very dynamic layouts where panel widths and heights can adapt to the available space.

### Step 1. Create a scene

Start using the flexbox layout by creating a scene with `body` configured as `SceneFlexLayout`:

```ts
const scene = new EmbeddedScene({
  body: new SceneFlexLayout({}),
});
```

### Step 2. Configure flexbox layout

`SceneFlexLayout` allows flexbox behavior configuration. You can configure the following properties:

- `direction` - Configures the main axis of flexbox layout. Children placed within the layout follow its direction.
- `wrap` - Configures the behavior of layout children. By default, children try to fit into one line.

By default, `SceneFlexLayout` uses `row` direction. To create a column layout, use the following code:

```ts
const scene = new EmbeddedScene({
  body: new SceneFlexLayout({
    direction: 'column',
  }),
});
```

### Step 3. Add layout children

`SceneFlexLayout` has a `children` property. It accepts an array of `SceneFlexItem` or `SceneFlexLayout` objects.
Create a scene with two, equally sized layout items in a column:

```ts
const scene = new EmbeddedScene({
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

const scene = new EmbeddedScene({
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

const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries().setTitle('Time series').build(),
      }),
      new SceneFlexItem({
        body: PanelBuilders.table().setTitle('Table').build(),
      }),
    ],
  }),
});
```

This will render two panels, a Time series and a Table panel.

:::note
For `SceneFlexItems` that contain `VizPanel` objects, it's recommended that you set `minHeight` or `minWidth` constraints so the panels aren't overly compressed by limited screen space.
:::

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

## CSS grid layout

As an alternative to `SceneFlexLayout`, `SceneCSSGridLayout` is available to wrap scene items in a CSS Grid.

```ts
const scene = new EmbeddedScene({
  body: new SceneCSSGridLayout({
    templateColumns: `repeat(auto-fit, minmax(400px, 1fr))`,
    children: [
      PanelBuilders.timeseries().setTitle('Graph 1').build(),
      PanelBuilders.timeseries().setTitle('Graph 2').build(),
    ],
  }),
});
```

`SceneCSSGridLayout` accepts `children` the same as `SceneFlexLayout`, and has the following properties for applying CSS grid styles:

```ts
autoRows?: CSSProperties['gridAutoRows'];
templateRows?: CSSProperties['gridTemplateRows'];
templateColumns: CSSProperties['gridTemplateColumns'];
/** In Grafana design system grid units (8px)  */
rowGap: number;
/** In Grafana design system grid units (8px)  */
columnGap: number;
justifyItems?: CSSProperties['justifyItems'];
alignItems?: CSSProperties['alignItems'];
justifyContent?: CSSProperties['justifyContent'];
// For sizing constaints on smaller screens
md?: SceneCSSGridLayoutState;
```

With CSS Grid it's easy to build a dynamic grid of panels where panel size constraints can be specific on the grid itself instead of each panel. Very useful
for building grids of equally sized panels.

The grid layout below is configured to have child elements with a minimum size of 400px and if there is more space available split it equally. The height
is set using autoRows. This configuration will enable a very responsive layout of equally sized panels.

```ts
const scene = new EmbeddedScene({
  body: new SceneCSSGridLayout({
    templateColumns: `repeat(auto-fit, minmax(400px, 1fr))`,
    autoRows: '150px',
    rowGap: 2,
    columnGap: 2,
    children: [
      new SceneCSSGridItem({
        body: PanelBuilders.timeseries().setTitle('Time series').build(),
      }),
      new SceneCSSGridItem({
        body: PanelBuilders.table().setTitle('Table').build(),
      }),
      new SceneCSSGridItem({
        body: PanelBuilders.timeseries().setTitle('Time series').build(),
      }),
      new SceneCSSGridItem({
        body: PanelBuilders.table().setTitle('Table').build(),
      }),
    ],
  }),
});
```

The SceneCSSGridItem wrapper around each child is optional.

## Grid layout

`SceneGridLayout` allows you to build scenes as grids of elements that can be dragged and moved around. This is the default layout used by the core Dashboard experiance in Grafana. It is
not recommended for scene app plugins unless you need users to be able to move panels around.

### Step 1. Create a scene

Start using grid layout by creating a scene with `body` configured as `SceneGridLayout`:

```ts
const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneGridLayout({}),
});
```

### Step 2. Configure grid layout

`SceneGridLayout` allows grid behavior configuration. The provided grid has 24 columns.

You can configure the following properties:

- `isDraggable` - Configures whether or not grid items can be moved.
- `isLazy` - Configures whether or not grid items should be initialized when they are outside of the viewport.

```ts
const scene = new EmbeddedScene({
  $data: queryRunner,
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
const scene = new EmbeddedScene({
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
const scene = new EmbeddedScene({
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
        body: PanelBuilders.timeseries().setTitle('Time series').build(),
      }),
      new SceneGridItem({
        x: 12,
        y: 0,
        width: 12,
        height: 10,
        isResizable: false,
        isDraggable: false,
        body: PanelBuilders.table().setTitle('Table').build(),
      }),
    ],
  }),
});
```

### Step 5. Add a grid row

A grid row is a layout item that groups other `SceneGridItems` into a collapsible row. Use `SceneGridRow` to add a row to a scene:

:::note
In `SceneGridRow`, the `x` and `y` coordinates are relative to the row.
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
      body: PanelBuilders.timeseries().setTitle('Time series').build(),
    }),
    new SceneGridItem({
      x: 12,
      y: 0,
      width: 12,
      height: 10,
      isResizable: false,
      isDraggable: false,
      body: PanelBuilders.table().setTitle('Table').build(),
    }),
  ],
});

const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneGridLayout({
    children: [row],
  }),
});
```

## Split layout

`SplitLayout` allows you to build scenes as combinations of separate resizable panes, oriented either vertically or horizontally.

### Step 1. Create a scene

Start using the split layout by creating a scene with `body` configured as `SplitLayout`:

```ts
const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SplitLayout({}),
});
```

### Step 2. Configure split layout

`SplitLayout` allows several configuration options:

- `direction` - Configures whether panes are oriented by row or column.
- `primary` - The first pane.
- `secondary` - The second pane

```ts
const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SplitLayout({
    direction: 'column',
  }),
});
```

### Step 3. Provide `primary` and `secondary` objects

`primary` and `secondary` both accept a `SceneFlexItemLike` object.

```ts
const scene = new EmbeddedScene({
  $data: queryRunner,
  body: new SplitLayout({
    direction: 'column',
    primary: PanelBuilders.timeseries().setTitle('Primary panel').build(),
    secondary: PanelBuilders.table().setTitle('Secondary panel').build(),
  }),
});
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/scene-layout.tsx)
