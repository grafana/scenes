# v0.27.0 (Tue Aug 29 2023)

### Release Notes

#### Allow time range comparison ([#244](https://github.com/grafana/scenes/pull/244))

You can now automatically perform queries against a secondary time range to visualize time-over-time comparisons. Use `SceneTimeRangeCompare` as in the example below:

```ts
const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'A',
      expr: 'rate(prometheus_http_requests_total{handler=~"/metrics"}[5m])',
    },
  ],
});

const scene = new EmbeddedScene({
  $data: queryRunner,
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  controls: [
    new SceneTimePicker({}), 
    new SceneTimeRangeCompare({}) // Use this object to enable time frame comparison UI
  ],
  body: new SceneFlexLayout({
    direction: 'row',
    children: [
      new SceneFlexItem({
        width: '100%',
        height: '100%',
        body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
      }),
    ],
  }),
 });
```

---

#### 🚀 Enhancement

- `@grafana/scenes`
  - Allow time range comparison [#244](https://github.com/grafana/scenes/pull/244) ([@dprokop](https://github.com/dprokop) [@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.26.0 (Tue Aug 29 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - sceneUtils: cloneSceneObjectState [#297](https://github.com/grafana/scenes/pull/297) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.25.0 (Tue Aug 22 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Fixes issues when being cloned [#288](https://github.com/grafana/scenes/pull/288) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Allow template variables to be cancelled [#261](https://github.com/grafana/scenes/pull/261) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.24.2 (Mon Aug 21 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneTimeRange: Don't update state if time range has not changed [#291](https://github.com/grafana/scenes/pull/291) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.24.1 (Fri Aug 18 2023)

#### 🐛 Bug Fix

- Adding developer portal dev workflow and config [#276](https://github.com/grafana/scenes/pull/276) ([@tolzhabayev](https://github.com/tolzhabayev))
- `@grafana/scenes`
  - SceneObject: Warn if parent is already set to another SceneObject [#284](https://github.com/grafana/scenes/pull/284) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Handle plugin not found scenario correctly [#287](https://github.com/grafana/scenes/pull/287) ([@dprokop](https://github.com/dprokop))
  - VariableValueSelectors: Don't wrap labels [#285](https://github.com/grafana/scenes/pull/285) ([@dprokop](https://github.com/dprokop))
  - SceneDebugger: Scene graph explore & state viewer [#262](https://github.com/grafana/scenes/pull/262) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.24.0 (Fri Aug 04 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Tabs: Add icon and suffix [#248](https://github.com/grafana/scenes/pull/248) ([@pbaumard](https://github.com/pbaumard))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - PanelBuilders: Fix default options being mutated [#274](https://github.com/grafana/scenes/pull/274) ([@dprokop](https://github.com/dprokop))

#### 🔩 Dependency Updates

- `@grafana/scenes`
  - Bump grafana dependencies [#273](https://github.com/grafana/scenes/pull/273) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Pierre Baumard ([@pbaumard](https://github.com/pbaumard))

---

# v0.23.0 (Wed Jul 19 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Behaviors: Provide behavior for visualization cursor sync [#259](https://github.com/grafana/scenes/pull/259) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.22.0 (Wed Jul 19 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Mark grafana dependencies as peerDependencies [#268](https://github.com/grafana/scenes/pull/268) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.21.0 (Tue Jul 18 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - FieldConfigOverridesBuilder: Simplify matchFieldsByValue API [#267](https://github.com/grafana/scenes/pull/267) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.20.1 (Thu Jul 13 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - PanelBuilders: Fix regex matcher for overrides [#264](https://github.com/grafana/scenes/pull/264) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.20.0 (Tue Jul 11 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Behaviors: Enabled type stateless behavior params [#254](https://github.com/grafana/scenes/pull/254) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.19.0 (Tue Jul 11 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Provide rangeRaw in request [#253](https://github.com/grafana/scenes/pull/253) ([@dprokop](https://github.com/dprokop))
  - SceneGridItem: Makes isDraggable and isResizable optional [#251](https://github.com/grafana/scenes/pull/251) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - GridLayout: Default isDraggable to false (unset) [#246](https://github.com/grafana/scenes/pull/246) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.18.0 (Wed Jul 05 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneGridLayout: Fixes draggable attribute [#245](https://github.com/grafana/scenes/pull/245) ([@torkelo](https://github.com/torkelo))
  - SceneGridLayout: Fixes issues with unmount on every re-render [#243](https://github.com/grafana/scenes/pull/243) ([@torkelo](https://github.com/torkelo))
  - Querying: Support runtime registered data source [#159](https://github.com/grafana/scenes/pull/159) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridRow: Fix rows auto collapsing on load due to url sync [#241](https://github.com/grafana/scenes/pull/241) ([@torkelo](https://github.com/torkelo))
  - SceneQueryRunner: Support `liveStreaming` [#239](https://github.com/grafana/scenes/pull/239) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.17.2 (Tue Jun 27 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Cancel previous request when starting new one [#238](https://github.com/grafana/scenes/pull/238) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.17.1 (Wed Jun 21 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - PanelBuilders: Add method for setting behaviors [#235](https://github.com/grafana/scenes/pull/235) ([@dprokop](https://github.com/dprokop))
  - SplitLayout: Add Splitter and SplitLayout [#229](https://github.com/grafana/scenes/pull/229) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.17.0 (Mon Jun 19 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Allow queries to be cancelled [#220](https://github.com/grafana/scenes/pull/220) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.16.0 (Mon Jun 19 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - PanelBuilders: Typed API for VizPanel creation [#225](https://github.com/grafana/scenes/pull/225) ([@dprokop](https://github.com/dprokop))

#### ⚠️ Pushed to `main`

- Update env for docs deployment ([@dprokop](https://github.com/dprokop))
- Trigger docs build ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.15.0 (Fri Jun 09 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneAppPage: Fix page with tabs and drilldown on main page level [#228](https://github.com/grafana/scenes/pull/228) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.14.0 (Thu Jun 01 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Only use containerWidth when maxDataPointsFromWidth is true [#223](https://github.com/grafana/scenes/pull/223) ([@torkelo](https://github.com/torkelo))
  - SceneQueryRunner: Re-run queries onActivate when time range changed [#221](https://github.com/grafana/scenes/pull/221) ([@torkelo](https://github.com/torkelo))
  - TimeRangePicker: Default to the "isOnCanvas" true look [#222](https://github.com/grafana/scenes/pull/222) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.13.0 (Tue May 30 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Behaviors: Variable changed [#219](https://github.com/grafana/scenes/pull/219) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.12.1 (Fri May 26 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - QueryVariable: Correct picker for multi-value variable [#218](https://github.com/grafana/scenes/pull/218) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.12.0 (Thu May 25 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneAppPage: Support react elements in subtitle [#196](https://github.com/grafana/scenes/pull/196) ([@torkelo](https://github.com/torkelo))

#### 📝 Documentation

- Core Concepts: Small docs changes [#206](https://github.com/grafana/scenes/pull/206) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.11.0 (Tue May 23 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Macros: Url macro [#199](https://github.com/grafana/scenes/pull/199) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
  - Macros: Add __timezone macro [#200](https://github.com/grafana/scenes/pull/200) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.10.0 (Tue May 23 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Macros: Add from and to macro [#197](https://github.com/grafana/scenes/pull/197) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.9.0 (Mon May 22 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Scene utils: Expose helper for building drilldown links [#193](https://github.com/grafana/scenes/pull/193) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.8.1 (Thu May 18 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneDataTransformer: Correctly resolve isDataReadyToDisplay [#194](https://github.com/grafana/scenes/pull/194) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.8.0 (Thu May 18 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Initial data state to avoid unnecesary No data messages [#190](https://github.com/grafana/scenes/pull/190) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.7.1 (Wed May 17 2023)

#### 🐛 Bug Fix

- Docs: Bring back missing sections [#185](https://github.com/grafana/scenes/pull/185) ([@dprokop](https://github.com/dprokop))
- `@grafana/scenes`
  - SceneReactObject: Fix type issue [#191](https://github.com/grafana/scenes/pull/191) ([@torkelo](https://github.com/torkelo))
  - SceneAppPage: Fixes issue with duplicate breadcrumbs [#175](https://github.com/grafana/scenes/pull/175) ([@torkelo](https://github.com/torkelo))

#### 📝 Documentation

- Docs: Transformations [#177](https://github.com/grafana/scenes/pull/177) ([@dprokop](https://github.com/dprokop))
- `@grafana/scenes`
  - Docs: SceneApp [#172](https://github.com/grafana/scenes/pull/172) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.7.0 (Mon May 08 2023)

### Release Notes

#### Add support for timezones ([#167](https://github.com/grafana/scenes/pull/167))

You can now use multiple time zones in Scene. `SceneTimeRange` and `SceneTimePicker` respect time zone settings. Additionally, a new object was added, `SceneTimeZoneOverride`. It can be used to override the time zone provided by a time range object higher in the scene hierarchy. Objects within `SceneTimeZoneOverride` scope will use the closest `SceneTimeRange` range, but a locally specified time zone.

Example: 

```ts
const scene = new EmbeddedScene({
  $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now', timeZone: 'browser'}),
  children: [
    // Will use global time range and time zone
    new VizPanel({
      $data: new SceneQueryRunner({ ... }),
      ...
    }),
    // Will use global time range and locally specified time zone
    new VizPanel({ 
      $timeRange: new SceneTimeZoneOverride({ timeZone: 'America/New_York' }),
      $data: new SceneQueryRunner({ ... }),
      ...
    }),
  ],
  ...
})
```

---

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Support adding header actions to top right corner of PanelChrome [#174](https://github.com/grafana/scenes/pull/174) ([@torkelo](https://github.com/torkelo))
  - SceneAppPage: Add support for custom title [#171](https://github.com/grafana/scenes/pull/171) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Docs: Activation handlers [#165](https://github.com/grafana/scenes/pull/165) ([@dprokop](https://github.com/dprokop))
- `@grafana/scenes`
  - Add support for timezones [#167](https://github.com/grafana/scenes/pull/167) ([@dprokop](https://github.com/dprokop))
  - FlexLayout: Responsive breakpoints [#156](https://github.com/grafana/scenes/pull/156) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.6.0 (Fri Apr 21 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneObjectBase: Fixes issue with useState subscription misses state change that happens between frist render and useEffect [#161](https://github.com/grafana/scenes/pull/161) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.5.0 (Thu Apr 20 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - FormatRegistry: New format added [#155](https://github.com/grafana/scenes/pull/155) ([@juanicabanas](https://github.com/juanicabanas) [@dprokop](https://github.com/dprokop))
  - VizPanel: Support noPadding panel plugins [#158](https://github.com/grafana/scenes/pull/158) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Support runtime registered panel plugins [#154](https://github.com/grafana/scenes/pull/154) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Docs: Add variables and advanced usage docs [#157](https://github.com/grafana/scenes/pull/157) ([@dprokop](https://github.com/dprokop))
- Docs: Layout objects [#152](https://github.com/grafana/scenes/pull/152) ([@dprokop](https://github.com/dprokop))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- juanicabanas ([@juanicabanas](https://github.com/juanicabanas))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.4.0 (Tue Apr 18 2023)

### Release Notes

#### Behaviors: Add state and runtime behavior to any scene object ([#119](https://github.com/grafana/scenes/pull/119))

You can now augment any scene object with runtime state & behavior using the new `$behaviors` state key. Behaviors are implemented as SceneObjects that are activated when their parent is activated or as pure functions that get called when the SceneObject they are attached to get's activated. 

With behaviors you can easily implement conditional display of panels using the new `isHidden` property on SceneFlexItem. and other dynamic layout behaviors. View the [behaviors demo](https://github.com/grafana/scenes/blob/main/packages/scenes-app/src/demos/behaviors/behaviorsDemo.tsx) for some examples.

---

#### 🚀 Enhancement

- `@grafana/scenes`
  - Behaviors: Add state and runtime behavior to any scene object [#119](https://github.com/grafana/scenes/pull/119) ([@torkelo](https://github.com/torkelo))
  - SceneObjectBase: Activate parents before children [#148](https://github.com/grafana/scenes/pull/148) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Docs: Getting started and core concepts [#136](https://github.com/grafana/scenes/pull/136) ([@dprokop](https://github.com/dprokop))
- SceneApp: Share defaults between demos [#132](https://github.com/grafana/scenes/pull/132) ([@torkelo](https://github.com/torkelo))
- PackageJson: Simple scripts to run app dev from root [#133](https://github.com/grafana/scenes/pull/133) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
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

- `@grafana/scenes`
  - SceneObject: Rename SceneObjectStatePlain to SceneObjectState [#122](https://github.com/grafana/scenes/pull/122) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Updates to support panel context [#113](https://github.com/grafana/scenes/pull/113) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
  - SceneObject: Add forEachChild to SceneObject interface and SceneObjectBase [#118](https://github.com/grafana/scenes/pull/118) ([@torkelo](https://github.com/torkelo))
  - SceneObject: Change how activate works and remove deactivate [#114](https://github.com/grafana/scenes/pull/114) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - LayoutTypes: Cleanup old types that are no longer needed [#120](https://github.com/grafana/scenes/pull/120) ([@torkelo](https://github.com/torkelo))
  - Interpolation: Add support for __value.* macro that uses new scopedVar data context [#103](https://github.com/grafana/scenes/pull/103) ([@torkelo](https://github.com/torkelo))

#### ⚠️ Pushed to `main`

- `@grafana/scenes`
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

- `@grafana/scenes`
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

The  SceneObjectUrlSyncHandler interface has changed. The function `getUrlState` no longer takes state as parameter. The implementation needs to use the current scene object state instead.

---

#### 🚀 Enhancement

- `@grafana/scenes`
  - UrlSync: Simplify url sync interface [#100](https://github.com/grafana/scenes/pull/100) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Auto: Removing label condition that did not work [#109](https://github.com/grafana/scenes/pull/109) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
  - Clean up changelog [#108](https://github.com/grafana/scenes/pull/108) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.0.32 (Mon Mar 27 2023)

  - Scene: Support for new types of "macro" variables starting with __all_variables [#98](https://github.com/grafana/scenes/pull/98) ([@domasx2](https://github.com/domasx2) [@torkelo](https://github.com/torkelo))
  - UrlSyncManager: Improvements and fixes [#96](https://github.com/grafana/scenes/pull/96) ([@torkelo](https://github.com/torkelo))

  * UrlSync: SceneObject that implement url sync _urlSync property will now see a change to how updateFromUrl is called. It is now called with null values when url query parameters are removed. Before the UrlSyncManager would remember the initial state and pass that to updateFromUrl, but now if you want to preserve your current state or set to some initial state you have to handle that logic inside updateFromUrl.

# v0.0.28 (Tue Mar 21 2023)

* Removal of isEditing from SceneComponentProps (also $editor from SceneObjectState, and sceneGraph.getSceneEditor)
* DataSourceVariable state change, query property is now named pluginId

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
