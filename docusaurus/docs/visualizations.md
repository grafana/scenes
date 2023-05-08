---
id: visualizations
title: Visualizations
---

# Visualizations

You can add visualizations to your scene by using the scene object class `VizPanel`.

## Simple VizPanel example

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
The pluginId `timeseries` used above refers to the core Grafana panel plugin which is the standard graph visualization for time indexed data. The `options` and `fieldConfig` are the same options you would see
in your normal dashboard panels when you view `Panel JSON` from the panel inspect drawer. You find the panel inspect drawer in the panel menu under the name `Inspect`.
:::

## Data

VizPanel will use the `sceneGraph.getData(model)` call to find and subscribe to the closest parent that has a `SceneDataProvider`. What this means is that it will use `$data` set on it's own level or share data with other siblings and scene objects if `$data` is set on any parent level.


## Header actions

VizPanel has a property named `headerActions` that can be either a `React.ReactNode` or a custom `SceneObject`. This property is useful if you want to place links or buttons in the top right corner of the panel header. Example:

```ts
new VizPanel({
    pluginId: 'timeseries',
    title: 'Time series',
    headerActions: (
      <LinkButton size="sm" variant="secondary" href="scene/sdrilldown/url">Drilldown</LinkButton>
    )
})
```

Placing buttons in the top right corner of the panel header could be used for:

* Links to other scenes
* Buttons that change the current scene (add drilldown view for example)
* RadioButtonGroup that changes the visualization settings

For LinkButton, Button and RadioButtonGroup please use size="sm" when placed in the panel header.

## Custom visualizations

If you want to visualize data yourself in your Grafana app plugin you can do that in two ways. You always have the option to create a custom SceneObject. But then you will not get the PanelChrome with loading state and other features
that VizPanel provides. If you want a custom visualization inside a panel frame that should look like the other panels in your scene then it's best to register a runtime panel plugin.

Start by defining your panel options and field config.

```ts
interface CustomVizOptions {
  mode: string;
}

interface CustomVizFieldOptions {
  numericOption: number;
}

interface Props extends PanelProps<CustomVizOptions> {}
```

Then you can define the react component that renders your custom PanelPlugin.

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

Now your ready to create your PanelPlugin instance and register it with the scenes library.

```ts
const myCustomPanel = new PanelPlugin<MyCustomOptions, MyCustomFieldOptions>(CustomVizPanel);

registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });
```

You can now use this pluginId in any `VizPanel`. Make sure you specify a pluginId that includes your scene app name and is unlikely to conflict with other scene apps.

For more information read the offical [tutorial on building panel plugins](https://grafana.com/tutorials/build-a-panel-plugin). Just remember that for scene runtime panel plugins
you do not need a plugin.json file for the panel plugin. It will not be a standalone plugin that you can use in dashboards. it will only be something that can be referenced inside your scene app.
