---
id: visualizations
title: Visualizations
---

# Visualizations

You can add visualizations to your scene by using the scene object class `VizPanel`.

## Simple `VizPanel` example

```ts
new VizPanel({
    pluginId: 'timeseries',
    title: 'Time series',
    options: {
        legend: {
            showLegend: false,
        }
    },
    fieldConfig: {
        defaults: {
            unit: 'bytes',
            min: 0,
            custom: { lineWidth: 2 fillOpacity: 6 },
        },
        overrides: [],
    }
})
```

:::note
The pluginId, `timeseries`, used in the preceding example refers to the core Grafana panel plugin, which is the standard graph visualization for time indexed data. The `options` and `fieldConfig` are the same options you would see
in a typical dashboard panel when you view the **JSON** tab in the panel inspect drawer. To access this tab, click **Inspect > Panel JSON** in the panel edit menu.
:::

## Data

`VizPanel` uses the `sceneGraph.getData(model)` call to find and subscribe to the closest parent that has a `SceneDataProvider` object. This means `VizPanel` uses `$data` set on its own level or shares data with other siblings and scene objects if `$data` is set on any parent level.

## Header actions

`VizPanel` has a property named `headerActions` that can be either `React.ReactNode` or a custom `SceneObject`. This property is useful if you want to place links or buttons in the top right corner of the panel header. For example:

```ts
new VizPanel({
  pluginId: 'timeseries',
  title: 'Time series',
  headerActions: (
    <LinkButton size="sm" variant="secondary" href="scenes/drilldown/url">
      Drilldown
    </LinkButton>
  ),
});
```

Buttons in the top right corner of the panel header can be used for:

- Links to other scenes
- Buttons that change the current scene (add a drill-down page, for example)
- A `RadioButtonGroup` that changes the visualization settings

For `LinkButton`, `Button`, and `RadioButtonGroup`, use size="sm" when you place them in the panel header.

## Standard Grafana visualizations

Scenes come with a helper API, `PanelBuilders`, for building [standard Grafana visualizations](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/). Those include:

- Bar chart
- Bar gauge
- Datagrid
- Flame graph
- Gauge
- Geomap
- Heatmap
- Histogram
- Logs
- News
- Node graph
- Pie chart
- Stat
- State timeline
- Status history
- Table
- Text
- Time series
- Trend
- Traces
- XY chart

`PanelBuilders` API provides support for building `VizPanel` objects for the visualizations listed above, with panel options and field configuration supported.

### Step 1. Import `PanelBuilders` API

```ts
import { PanelBuilders } from '@grafana/scenes';
```

### Step 2. Configure standard visualization `VizPanel` object

```ts
const myTimeSeriesPanel = PanelBuilders.timeseries().setTitle('My first panel');
```

### Step 3. Configure data and time range

```ts
const data = new SceneQueryRunner({
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
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
});

myTimeSeriesPanel.setData(data);
```

### Step 4. Configure panel options

```ts
myTimeSeriesPanel.setOption('legend', { asTable: true }).setOption('tooltip', { mode: TooltipDisplayMode.Single });
```

### Step 4. Configure standard options

All Grafana visualizations come with a standard options. `PanelBuilders` provide methods for setting each standard option individually.
Read more about standard options in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-standard-options/#standard-options-definitions).

```ts
myTimeSeriesPanel.setDecimals(2).setUnit('ms');
```

### Step 4. Configure custom field config

Grafana visualizations provide custom, visualization specific configuration options called _field config_.
Read more about field config in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/#field-configurations).

Use `setCustomFieldConfig` method to set value of desired field config property.

```ts
myTimeSeriesPanel.setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth);
```

### Step 5. Configure overrides

Read more about overrides in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-standard-options/#standard-options-definitions).

Use `setOverrides` method to set desired field config override. For standard options use `override<OptionName>` method. For custom field config use `overrideCustomConfigProperty` method.

```ts
myTimeSeriesPanel.setOverrides((b) =>
  b.matchFieldsWithNameByRegex('/metrics/').overrideDecimals(4).overrideCustomConfigProperty('lineWidth', 5)
);
```

### Step 6. Build visualization

Use `build` method to get configured `VizPanel` object:

```ts
const myPanel = myTimeSeriesPanel.build();
```

Such built panel is now ready to be used in a scene.

## Custom visualizations

If you want to determine how data is visualized in your Grafana app plugin, you can do so in two ways. You always have the option to create a custom `SceneObject`, but you won't get the `PanelChrome` with loading state and other features
that `VizPanel` provides. If you want a custom visualization inside a panel frame that should look like the other panels in your scene, then it's best to register a runtime panel plugin.

### Step 1. Define custom panel options and field config

```ts
interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption: number;
}

interface Props extends PanelProps<CustomVizOptions> {}
```

### Step 2. Define the react component that renders custom `PanelPlugin`

```ts
export function CustomVizPanel(props: Props) {
  const { options, data } = props;

  return (
    <div>
      <h4>CustomVizPanel {options.mode}</h4>
      <div>FieldConfig: {JSON.stringify(data.series[0]?.fields[0]?.config)}</div>
    </div>
  );
}
```

### Step 3. Create `PanelPlugin` instance and register it with the Scenes library

```ts
import { sceneUtils } from '@grafana/scenes';

const myCustomPanel = new PanelPlugin<MyCustomOptions, MyCustomFieldOptions>(CustomVizPanel);

sceneUtils.registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });
```

You can now use this pluginId in any `VizPanel`. Make sure you specify a pluginId that includes your scene app name and is unlikely to conflict with other Scenes apps.

For more information, refer to the official [tutorial on building panel plugins](https://grafana.com/tutorials/build-a-panel-plugin). Just remember that for Scenes runtime panel plugins,
you don't need a plugin.json file for the panel plugin, as it won't be a standalone plugin that you can use in Dashboards. You'll only be able to reference the plugin inside your Scenes app.
