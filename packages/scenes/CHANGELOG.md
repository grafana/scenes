# v0.0.32 (Mon Mar 27 2023)

#### 🐛 Bug Fix

- Enable auto [#107](https://github.com/grafana/scenes/pull/107) ([@torkelo](https://github.com/torkelo))
- Fix type import [#104](https://github.com/grafana/scenes/pull/104) ([@torkelo](https://github.com/torkelo))
- my bad ([@torkelo](https://github.com/torkelo))
- Fix type import ([@torkelo](https://github.com/torkelo))
- Macros: Share SkipFormattingValue value between AllUrlVariablesMacro and UrlTimeRangeMacro [#101](https://github.com/grafana/scenes/pull/101) ([@torkelo](https://github.com/torkelo))
- Share skip formatting ([@torkelo](https://github.com/torkelo))
- Scene: Support for new types of "macro" variables starting with __all_variables [#98](https://github.com/grafana/scenes/pull/98) ([@domasx2](https://github.com/domasx2) [@torkelo](https://github.com/torkelo))
- Removed some old code ([@torkelo](https://github.com/torkelo))
- Updates ([@torkelo](https://github.com/torkelo))
- More refactoring ([@torkelo](https://github.com/torkelo))
- Refactoring and added time range macro ([@torkelo](https://github.com/torkelo))
- Refactoring ([@torkelo](https://github.com/torkelo))
- fix ([@torkelo](https://github.com/torkelo))
- Fixed ts issues ([@torkelo](https://github.com/torkelo))
- Merge branch 'main' of github.com:grafana/scenes into scene-url-variables ([@torkelo](https://github.com/torkelo))
- ScenesApp: Change to workspace dependency [#99](https://github.com/grafana/scenes/pull/99) ([@torkelo](https://github.com/torkelo))
- UrlSyncManager: Improvements and fixes [#96](https://github.com/grafana/scenes/pull/96) ([@torkelo](https://github.com/torkelo))
- remove unused arg ([@torkelo](https://github.com/torkelo))
- Add skipUrlSync support ([@torkelo](https://github.com/torkelo))
- Variables: Add support for macro variables like __all_variables ([@torkelo](https://github.com/torkelo))
- Merge branch 'scene-interpolate-all-variables' into domas-interpolate-all-variables ([@torkelo](https://github.com/torkelo))
- Simplify logic ([@torkelo](https://github.com/torkelo))
- minor fix ([@torkelo](https://github.com/torkelo))
- Made tests a bit clear on what scenario they where testing ([@torkelo](https://github.com/torkelo))
- remove unnessary cleanup in EmbeddedScene ([@torkelo](https://github.com/torkelo))
- UrlSyncManager: Improvements and fixes ([@torkelo](https://github.com/torkelo))
- Update ([@torkelo](https://github.com/torkelo))
- Changelog: Clean up auto crap [#94](https://github.com/grafana/scenes/pull/94) ([@torkelo](https://github.com/torkelo))
- Fixing changelog ([@torkelo](https://github.com/torkelo))
- test ([@torkelo](https://github.com/torkelo))
- Yarn: Caching should work [#93](https://github.com/grafana/scenes/pull/93) ([@torkelo](https://github.com/torkelo))
- interpolate all variables ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.0.28 (Tue Mar 21 2023)

- Removal of isEditing from SceneComponentProps (also $editor from SceneObjectState, and sceneGraph.getSceneEditor)
- DataSourceVariable state change, query property is now named pluginId

---

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
