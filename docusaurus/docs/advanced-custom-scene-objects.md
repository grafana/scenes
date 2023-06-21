---
id: advanced-custom-scene-objects
title: Custom scene objects
---

Scenes comes with extensibility in mind. In addition to the library primitives, you can build your own custom scene objects that extend the basic functionality of the library. This topic describes how to create a custom object.

## Create custom scene objects

Follow these steps to create a custom scene object.

### Step 1. Define the state type of the custom object

Start by defining the state type for your custom object. This interface must extend the `SceneObjectState` interface:

```ts
interface CounterState extends SceneObjectState {
  count: number;
}
```

### Step 2. Implement a custom object class

Implement a class for the custom scene object. This class must extend the `SceneObjectBase` class:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  public constructor(state?: Partial<CounterState>) {
    super({ count: 0, ...state });
  }
}
```

### Step 3. Implement a custom object renderer

Implement a React component that will be shown when the custom object is used in a scene. This component must use the `SceneComponentProps<T extends SceneObjectBase>` type for props:

```ts
function CounterRenderer(props: SceneComponentProps<Counter>) {
  return <div>Counter</div>;
}
```

Set a renderer for the `Counter` custom object using the `static Component` property:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  static Component = CounterRenderer;
}
```

### Step 4. Use a custom object state in the renderer

Use the `model` property passed to the component and subscribe to its state using the `model.useState()` hook. Any changes to the object state will re-render the component:

```ts
function CounterRenderer({ model }: SceneComponentProps<Counter>) {
  const { count } = model.useState();

  return (
    <div>
      <div>Counter: {count}</div>
    </div>
  );
}
```

### Step 5. Modify the state of the custom object from the component

Define the state-modifying method, (`onIncrement`), in the custom scene object:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  public static Component = CounterRenderer;

  public onIncrement = () => {
    this.setState({ count: this.state.count + 1 });
  };
}
```

Use the `onIncrement` method in the renderer:

```ts
function CounterRenderer({ model }: SceneComponentProps<Counter>) {
  const { count } = model.useState();

  return (
    <div>
      <div>Counter: {count}</div>
      <button onClick={model.onIncrement}>Increment counter</button>
    </div>
  );
}
```

### Step 6. Use the custom object in a scene

Now your custom scene object, `Counter`, is ready to be used in a scene. Create a scene that uses it:

```ts
const myScene = new EmbeddedScene({
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: new Counter(),
      }),
    ],
  }),
});
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-custom-scene-objects.tsx)
