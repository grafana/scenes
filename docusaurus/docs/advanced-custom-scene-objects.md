---
id: advanced-custom-scene-objects
title: Custom scene objects
---

Scenes comes with extensibility in mind. On top of the library primitives you can build your own custom scene objects that extend basic functionality of the library.

## Create custom scene object

### Step 1. Define state type of the custom object

Start with defining the state type for your custom object. This interface must extend `SceneObjectState` interface:

```ts
interface CounterState extends SceneObjectState {
  count: number;
}
```

### Step 2. Implement custom object class

Implement class for custom scene object. This class must extend `SceneObjectBase` class:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  public constructor(state?: Partial<CounterState>) {
    super({count: 0, ...state});
  }
}
```

### Step 3. Implement custom object renderer

Implement React component that will be shown when custom object is used in scene. This component must use `SceneComponentProps<T extends SceneObjectBase>` type for props:

```ts
function CounterRenderer(props: SceneComponentProps<Counter>) {
  return <div>Counter</div>;
}
```

Set renderer for `Counter` custom object using `static Component` property:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  static Component = CounterRenderer;

}
```

### Step 4. Use custom object state in renderer

Use `model` property passed to the component and subscribe to its state using `model.useState()` hook. Any changes to the object state will re-render the component:

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

### Step 5. Modify state of custom object from component

Defined state-modifying method (`onIncrement`) in custom scene object:

```ts
export class Counter extends SceneObjectBase<CounterState> {
  public static Component = CounterRenderer;


  public onIncrement = () => {
    this.setState({ count: this.state.count + 1 });
  };
}
```

Use `onIncrement` method in the renderer:

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

### Step 6. Use custom object in scene

Now your custom scene object `Counter` is ready to be used in scene. Create a scene that uses it:

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
