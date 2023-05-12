---
id: advanced-data
title: Data and time range in custom scene object
---

Custom scene objects can use data and time range added to scene to perform additional operations. To read more about data and time range configuration please read [Data and time range](./core-concepts#data-and-time-range) first.

## Use data

In custom scene object use `sceneGraph.getData(model)` call to find and subscribe to the closest parent that has a `SceneDataProvider`. This means it uses `$data` set on its own level or shares data with other siblings and scene objects if `$data` is set on any parent level.

### Use data in renderer

In your custom scene object renderer you can subscribe to the closest `SceneDataProvider` by using `sceneGraph.getData` utility:

```ts
import { sceneGraph, SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';

interface CustomObjectState extends SceneObjectState {
  // ...
}

class CustomObject extends SceneObjectBase<CustomObjectState> {
  // ...
}

function CustomObjectRenderer({ model }: SceneComponentProps<CustomObject>) {
  const data = sceneGraph.getData(model).useState();

  return <pre>{JSON.stringify(data)}</pre>;
}
```

### Use data in custom object class

You can also use data in your custom object class. To do that use [activation handler](./advanced-activation-handlers.md). In the activation handler get the closest `SceneDataProvider` using `sceneGraph.getData(this)`. Then, subscribe to `SceneDataProvider` state changes using `subscribeToStata` method of the `SceneObjectBase`:

```ts
class CustomObject extends SceneObjectBase<CustomObjectState> {
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

:::info
Not that the subscription returned from `sourceData.subscribeToState` is added to `this._subs`. Thanks to that, you don't need to do any cleanup when the custom object is destroyed, as the library will take care of unsubscribing.
:::

## Use time range

Similarly to data, you can use the closest time range in custom scene object. Use `sceneGraph.getTimeRange(model)` to get the closest time range scene object. This method can be used both in the custom object class and rendere as describe in above in [Use data](#use-data) section
