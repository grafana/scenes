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

## Menu

The menu property of type VizPanelMenu is optional, when set it defines a menu in the top right of the panel. The menu object is only activated when the dropdown menu itself is rendered. So the best way to add dynamic menu actions and links is by adding them in a [behavior](./advanced-behaviors.md) attached to the menu.

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

Scenes comes with a helper API, `PanelBuilders`, for building [standard Grafana visualizations](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/). These include:

- Bar chart
- Bar gauge
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

The `PanelBuilders` API provides support for building `VizPanel` objects for the visualizations listed above, with panel options and field configuration supported.

### Step 1. Import the `PanelBuilders` API

```ts
import { PanelBuilders } from '@grafana/scenes';
```

### Step 2. Configure the standard visualization `VizPanel` object

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

### Step 5. Configure standard options

All Grafana visualizations come with standard options. `PanelBuilders` provides methods for setting each standard option individually.
Read more about standard options in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-standard-options/#standard-options-definitions).

```ts
myTimeSeriesPanel.setDecimals(2).setUnit('ms');
```

### Step 6. Configure custom field configurations

Grafana visualizations provide custom, visualization-specific configuration options called _field configurations_.
Read more about field configurations in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/#field-configurations).

Use the `setCustomFieldConfig` method to set value of desired field config property.

```ts
myTimeSeriesPanel.setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth);
```

### Step 7. Configure overrides

Grafana visualizations allow you to customize visualization settings for specific fields or series. This is accomplished by adding an override rule that targets a particular set of fields and that can each define multiple options. Read more about overrides in the official [Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-overrides/).

Use the `setOverrides` method to set desired field config override. For standard options use `override<OptionName>` method. For custom field config use `overrideCustomConfigProperty` method.

```ts
myTimeSeriesPanel.setOverrides((b) =>
  b.matchFieldsWithNameByRegex('/metrics/').overrideDecimals(4).overrideCustomFieldConfig('lineWidth', 5)
);
```

A single override configuration starts with a **matcher** configuration. Thanks to matchers Grafana knows what part of the results the override should be applied to. The following matchers are available:

#### `matchFieldsWithName(name: string)`

Select a field from based on provided field name. Properties you add to a rule with this selector are only applied to this single field.

#### `matchFieldsWithNameByRegex(regex: string)`

Specify fields to override with a regular expression. Properties you add to a rule with this selector are applied to all fields where the field name match the regex.

#### `matchFieldsByType(fieldType: FieldType)`

Select fields by type, such as string, numeric, and so on. Properties you add to a rule with this selector are applied to all fields that match the selected type.

#### `matchFieldsByQuery(refId: string)`

Select all fields returned by a specific query, such as A, B, or C. Properties you add to a rule with this selector are applied to all fields returned by the selected query.

#### `matchFieldsByValue(options: FieldValueMatcherConfig)`

Select all fields that match provided value condition configuration. This matchers allows overrides configuration based on condition that is performed against reduced values of a series. You can configure overrides for example for series that have average higher than provided value.

#### `matchComparisonQuery(refId: string)`

Select all fields returned by a comparison query. Properties you add to a rule with this selector are applied to all fields returned by the comparison query performed for selected query. Read more about [Time range comparison](./advanced-time-range-comparison.md).

### Step 8. Build a visualization

Use the `build` method to generate a configured `VizPanel` object:

```ts
const myPanel = myTimeSeriesPanel.build();
```

### Step 9. Add the visualization to a scene

Create a scene with a layout and add the visualization as a layout child:

```ts
const scene = new EmbeddedScene({
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: myPanel,
      }),
    ],
  }),
});
```

This built panel is now ready to be used in a scene.

### Extract common visualization config to a mixin function

```ts
function latencyGraphMixin(builder: ReturnType<typeof PanelBuilders["timeseries"]>) {
  builder.setMin(0);
  builder.setOption('legend', { showLegend: false: true })
}

const panel = PanelBuilders.timeseries().applyMixin(latencyGraphMixin).setData(...)
```

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
      <h4>
        CustomVizPanel options: <pre>{JSON.stringify(options)}</pre>
      </h4>
      <div>
        CustomVizPanel field config: <pre>{JSON.stringify(data.series[0]?.fields[0]?.config)}</pre>
      </div>
    </div>
  );
}
```

### Step 3. Create `PanelPlugin` instance and register it with the Scenes library

```ts
import { sceneUtils } from '@grafana/scenes';

const myCustomPanel = new PanelPlugin<CustomVizOptions, CustomVizFieldOptions>(CustomVizPanel).useFieldConfig({
  useCustomConfig: (builder) => {
    builder.addNumberInput({
      path: 'numericOption',
      name: 'Numeric option',
      description: 'A numeric option',
      defaultValue: 1,
    });
  },
});

sceneUtils.registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });
```

### Step 4. Use custom panel in a scene

You can now use this pluginId in any `VizPanel`. Make sure you specify a pluginId that includes your scene app name and is unlikely to conflict with other Scenes apps.

```ts
const data = new SceneQueryRunner({
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
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
});

return new EmbeddedScene({
  $data: data,
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          pluginId: 'my-scene-app-my-custom-viz',
          options: { mode: 'my-custom-mode' },
          fieldConfig: {
            defaults: {
              unit: 'ms',
              custom: {
                numericOption: 100,
              },
            },
            overrides: [],
          },
        }),
      }),
    ],
  }),
});
```

For more information, refer to the official [tutorial on building panel plugins](https://grafana.com/tutorials/build-a-panel-plugin). Just remember that for Scenes runtime panel plugins,
you don't need a plugin.json file for the panel plugin, as it won't be a standalone plugin that you can use in Dashboards. You'll only be able to reference the plugin inside your Scenes app.

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/visualizations.tsx)
