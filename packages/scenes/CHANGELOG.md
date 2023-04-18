# v0.4.0 (Tue Apr 18 2023)

### Release Notes

#### Behaviors: Add state and runtime behavior to any scene object ([#119](https://github.com/grafana/scenes/pull/119))

You can now augment any scene object with runtime state & behavior using the new `$behaviors` state key. Behaviors are implemented as SceneObjects that are activated when their parent is activated or as pure functions that get called when the SceneObject they are attached to get's activated. 

With behaviors you can easily implement conditional display of panels using the new `isHidden` property on SceneFlexItem. and other dynamic layout behaviors. View the [behaviors demo](https://github.com/grafana/scenes/blob/main/packages/scenes-app/src/demos/behaviorsDemo.tsx) for some examples.

---

#### 🚀 Enhancement

- Behaviors: Add state and runtime behavior to any scene object [#119](https://github.com/grafana/scenes/pull/119) ([@torkelo](https://github.com/torkelo))
- SceneObjectBase: Activate parents before children [#148](https://github.com/grafana/scenes/pull/148) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneQueryRunner: Return after setting empty state [#145](https://github.com/grafana/scenes/pull/145) ([@torkelo](https://github.com/torkelo))
- SceneGridLayout: Support lazy rendering of items out of view [#129](https://github.com/grafana/scenes/pull/129) ([@kaydelaney](https://github.com/kaydelaney) [@torkelo](https://github.com/torkelo))
- UrlSync: Makes url sync work on SceneAppPage level [#143](https://github.com/grafana/scenes/pull/143) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Refactorings and adding default fallback routes [#142](https://github.com/grafana/scenes/pull/142) ([@torkelo](https://github.com/torkelo))
- Flex layout item parent direction [#141](https://github.com/grafana/scenes/pull/141) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))
- SceneApp: Correctly build demo pages with getParentPage [#137](https://github.com/grafana/scenes/pull/137) ([@torkelo](https://github.com/torkelo))
- Templating: Add macros for __data, __field and __series [#131](https://github.com/grafana/scenes/pull/131) ([@torkelo](https://github.com/torkelo))
- FlexLayout: Allow SceneFlexLayout to be child of another flex layout [#135](https://github.com/grafana/scenes/pull/135) ([@dprokop](https://github.com/dprokop))
- FindObject: Fixes search logic so that it does not get stuck in infine  loops [#140](https://github.com/grafana/scenes/pull/140) ([@torkelo](https://github.com/torkelo))
- sceneGraph: findObject [#127](https://github.com/grafana/scenes/pull/127) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Support dynamic pages (changing tabs, title, controls) [#71](https://github.com/grafana/scenes/pull/71) ([@torkelo](https://github.com/torkelo))
- scene-app: Refactor to use SceneAppPage for demos [#125](https://github.com/grafana/scenes/pull/125) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- Packages: Update grafana/* to latest [#130](https://github.com/grafana/scenes/pull/130) ([@torkelo](https://github.com/torkelo))
- QueryEditor: Adds inline query editor scene object [#43](https://github.com/grafana/scenes/pull/43) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))
- SceneVariableSet: Refresh variables that depend on time range [#124](https://github.com/grafana/scenes/pull/124) ([@dprokop](https://github.com/dprokop))
- ValueMacro: Fixes so __value works for rowIndex 0 [#123](https://github.com/grafana/scenes/pull/123) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.3.0 (Mon Apr 03 2023)

### Release Notes

#### SceneObject: Rename SceneObjectStatePlain to SceneObjectState ([#122](https://github.com/grafana/scenes/pull/122))

`SceneObjectStatePlain` is now named `SceneObjectState`. So if you have custom scene objects that extends `SceneObjectStatePlain` just do a search and replace for `SceneObjectStatePlain` and replace with`SceneObjectState`.

---

#### 🚀 Enhancement

- SceneObject: Rename SceneObjectStatePlain to SceneObjectState [#122](https://github.com/grafana/scenes/pull/122) ([@torkelo](https://github.com/torkelo))
- VizPanel: Updates to support panel context [#113](https://github.com/grafana/scenes/pull/113) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- SceneObject: Add forEachChild to SceneObject interface and SceneObjectBase [#118](https://github.com/grafana/scenes/pull/118) ([@torkelo](https://github.com/torkelo))
- SceneObject: Change how activate works and remove deactivate [#114](https://github.com/grafana/scenes/pull/114) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- LayoutTypes: Cleanup old types that are no longer needed [#120](https://github.com/grafana/scenes/pull/120) ([@torkelo](https://github.com/torkelo))
- Interpolation: Add support for \_\_value.\* macro that uses new scopedVar data context [#103](https://github.com/grafana/scenes/pull/103) ([@torkelo](https://github.com/torkelo))

#### ⚠️ Pushed to `main`

- Revert "VizPanelRenderer: Only render when width and height greater than 0" ([@dprokop](https://github.com/dprokop))
- VizPanelRenderer: Only render when width and height greater than 0 ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.2.0 (Wed Mar 29 2023)

### Release Notes

#### Layout: Create atomic, layout specific objects ([#97](https://github.com/grafana/scenes/pull/97))

The interface of `SceneFlexLayout` and `SceneGridLayout` has changed. These scene objects now accept only dedicated layout item objects as children:

- `SceneFlexItem` for `SceneFlexLayout`
- `SceneGridItem` and `SceneGridRow` for `SceneGridLayout`

`placement` property has been replaced by those layout-specific objects.

Example

```tsx
// BEFORE
const layout = new SceneFlexLayout({
  direction: 'column',
  children: [
    new VizPanel({
      placement: {
        width: '50%',
        height: '400',
     },
     ...
    })
  ],
  ...
})


// AFTER
const layout = new SceneFlexLayout({
  direction: 'column',
  children: [
    new SceneFlexItem({
      width: '50%',
      height: '400',
      body: new VizPanel({ ... }),
    }),
  ],
  ...
})

```

---

#### 🚀 Enhancement

- Layout: Create atomic, layout specific objects [#97](https://github.com/grafana/scenes/pull/97) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))
- Interpolation: FormatRegistryID is now replaced by VariableFormatID from schema package [#112](https://github.com/grafana/scenes/pull/112) ([@ryantxu](https://github.com/ryantxu) [@torkelo](https://github.com/torkelo))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Ryan McKinley ([@ryantxu](https://github.com/ryantxu))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.1.0 (Mon Mar 27 2023)

### Release Notes

#### UrlSync: Simplify url sync interface ([#100](https://github.com/grafana/scenes/pull/100))

The SceneObjectUrlSyncHandler interface has changed. The function `getUrlState` no longer takes state as parameter. The implementation needs to use the current scene object state instead.

---

#### 🚀 Enhancement

- UrlSync: Simplify url sync interface [#100](https://github.com/grafana/scenes/pull/100) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Clean up changelog [#108](https://github.com/grafana/scenes/pull/108) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.0.32 (Mon Mar 27 2023)

- Scene: Support for new types of "macro" variables starting with \_\_all_variables [#98](https://github.com/grafana/scenes/pull/98) ([@domasx2](https://github.com/domasx2) [@torkelo](https://github.com/torkelo))
- UrlSyncManager: Improvements and fixes [#96](https://github.com/grafana/scenes/pull/96) ([@torkelo](https://github.com/torkelo))

* UrlSync: SceneObject that implement url sync \_urlSync property will now see a change to how updateFromUrl is called. It is now called with null values when url query parameters are removed. Before the UrlSyncManager would remember the initial state and pass that to updateFromUrl, but now if you want to preserve your current state or set to some initial state you have to handle that logic inside updateFromUrl.

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
