# 0.21 (2023-03-15)

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
 this._subs.add(
  sourceData.subscribeToState((state) => this.transform(state.data))
);
```

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
