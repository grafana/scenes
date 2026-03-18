---
id: advanced-data
title: Data and time range in custom scene objects
---

Custom scene objects can use data and time range information added to a scene to perform additional operations. This topic describes how to use these properties in renderers and custom object classes.

To learn more about data and time range configuration, refer to [Data and time range](./core-concepts#data-and-time-range) first.

## Use data

In custom scene object use `sceneGraph.getData(model)` call to find and subscribe to the closest parent that has a `SceneDataProvider`. This means it uses `$data` set on its own level or shares data with other siblings and scene objects if `$data` is set on any parent level.

### Use data in a renderer

In your custom scene object renderer, you can subscribe to the closest `SceneDataProvider` by using the `sceneGraph.getData` utility:

```ts
import { sceneGraph, SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';

interface CustomObjectState extends SceneObjectState {}

class CustomObject extends SceneObjectBase<CustomObjectState> {
  static Component = CustomObjectRenderer;
}

function CustomObjectRenderer({ model }: SceneComponentProps<CustomObject>) {
  const data = sceneGraph.getData(model).useState();

  return (
    <div>
      <pre>Time range: {JSON.stringify(data.data?.timeRange)}</pre>
      <pre>Data: {JSON.stringify(data.data?.series)}</pre>
    </div>
  );
}
```

### Use data in a custom object class

You can also use data in your custom object class. To do so, use an [activation handler](./advanced-activation-handlers.md). In the activation handler, get the closest `SceneDataProvider` using `sceneGraph.getData(this)`. Then, subscribe to `SceneDataProvider` state changes using the `subscribeToState` method of the `SceneObjectBase`:

```ts
class CustomObject extends SceneObjectBase<CustomObjectState> {
  static Component = CustomObjectRenderer;

  constructor() {
    super({});
    this.addActivationHandler(() => this.activationHandler());
  }

  private activationHandler() {
    const sourceData = sceneGraph.getData(this);

    this._subs.add(sourceData.subscribeToState((state) => console.log(state)));
  }
}
```

:::note
The subscription returned from `sourceData.subscribeToState` is added to `this._subs`. Because of this, you don't need to do any cleanup when the custom object is destroyed, as the library will take care of unsubscribing.
:::

## Use time range

Similarly to data, you can use the closest time range in a custom scene object using `sceneGraph.getTimeRange(model)`. This method can be used both in the custom object class and the renderer, as described previously in the [Use data](#use-data) section.

## Sharing same data provide

If you need to share the same data provider between many different scene objects and cannot do it by placing the $data on a shared common ancestor you can use the `DataProviderSharer`. This is a data provider that can share/forward data from another data provider.

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-data.tsx)
