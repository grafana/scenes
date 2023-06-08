---
id: visualizations
title: Visualizations
hide_title: true
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

> **Note:** The pluginId, `timeseries`, used in the preceding example refers to the core Grafana panel plugin, which is the standard graph visualization for time indexed data.
> The `options` and `fieldConfig` are the same options you would see in a typical dashboard panel when you view the **JSON** tab in the panel inspect drawer.
> To access this tab, click **Inspect > Panel JSON** in the panel edit menu.

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

## Custom visualizations

If you want to determine how data is visualized in your Grafana app plugin, you can do so in two ways. You always have the option to create a custom `SceneObject`, but you won't get the `PanelChrome` with loading state and other features
that `VizPanel` provides. If you want a custom visualization inside a panel frame that should look like the other panels in your scene, then it's best to register a runtime panel plugin.

Start by defining your panel options and field config:

```ts
interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption: number;
}

interface Props extends PanelProps<CustomVizOptions> {}
```

Then you can define the react component that renders your custom `PanelPlugin`.

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

Now you're ready to create your `PanelPlugin` instance and register it with the Scenes library:

```ts
import { sceneUtils } from '@grafana/scenes';

const myCustomPanel = new PanelPlugin<MyCustomOptions, MyCustomFieldOptions>(CustomVizPanel);

sceneUtils.registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });
```

You can now use this pluginId in any `VizPanel`. Make sure you specify a pluginId that includes your scene app name and is unlikely to conflict with other Scenes apps.

For more information, refer to the official [tutorial on building panel plugins](https://grafana.com/tutorials/build-a-panel-plugin). Just remember that for Scenes runtime panel plugins,
you don't need a plugin.json file for the panel plugin, as it won't be a standalone plugin that you can use in Dashboards. You'll only be able to reference the plugin inside your Scenes app.
