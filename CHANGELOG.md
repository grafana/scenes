# 0.21 (2023-03-17)

**SceneObject subscribeToState parameter change**

Signature change. Now the parameter to this function expects a simple function that takes two args (newState, prevState).

Before:

```ts
this._subs.add(
  sourceData.subscribeToState({
    next: (state) => this.transform(state.data),
  })
);
```

Becomes:

```ts
this._subs.add(sourceData.subscribeToState((state) => this.transform(state.data)));
```

**addActivationHandler**

SceneObject now has a new function called addActivationHandler that makes it much easier to add external behaviors to core scene componenents. The
activation handler (callback) can return a deactivation handler. This works very similar to useEffect.

For custom components that used to override activate and then call super.activate() we now recommend that you instead use addActivationHandler from
the constructor. See https://github.com/grafana/scenes/pull/77 for some examples.

**VizPanelMenu**

A new scene object to enable panel menu for `VizPanel`.

Example usage:

```ts
const menu = new VizPanelMenu({});

// Configure menu items
menu.addActivationHandler(() => {
  menu.setItems(menuItems);
});

// Attach menu to VizPanel
const panelWithMenu = new VizPanel({
  title: 'Panel with menu',
  menu,
  // ... VizPanel configuration
});
```

To see more examples, please look at [`VizPanelMenu` demo](./packages/scenes-app/src/pages/Demos/scenes/panelMenu.ts).

**Scene App demos**

Scene App included with this repo now contains Demos page in which we will continue providing examples of particular @grafana/scenes usages. Run `./scripts/demo.sh` and navigate to [http://localhost:3001/a/grafana-scenes-app/demos](http://localhost:3001/a/grafana-scenes-app/demos) to see available demos.

# 0.20 (2023-03-15)

**AppScenePage**

The getScene for drilldowns now expect the parent property to be of type AppScenePageLike (interface).

# 0.19 (2023-03-15)

**SceneQueryRunner no longer has transformations**

Instead you have to use SceneDataTransformer and set its internal $data property to the SceneQueryRunner to get the same effect.

Example:

```tsx
 $data: new SceneDataTransformer({
    $data: new SceneQueryRunner({...}),
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers: ['mean'],
        },
      },
    ],
  }),
```

SceneDataTransformer can still be used to transform parent scoped data, it will look for this if there is no $data property set.

The reasons for this change it to have more control over when only transformations should be re-processed (to not issue query again when only a dependency on the transforms changed).
It also removes some duplication between SceneQueryRunner and SceneDataTransformer. There is also a new interface SceneDataProvider.

```ts
export interface SceneDataProvider extends SceneObject<SceneDataState> {
  setContainerWidth?: (width: number) => void;
}
```

Change PR
https://github.com/grafana/scenes/pull/55
