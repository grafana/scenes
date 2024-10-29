# v5.20.1 (Mon Oct 14 2024)

#### 🐛 Bug Fix

- SceneContextObject: Export context object [#925](https://github.com/grafana/scenes/pull/925) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.18.1 (Mon Oct 07 2024)

#### 🐛 Bug Fix

- VizPanel: Fixes issue with viz panel when passing it SceneDataTransformer [#928](https://github.com/grafana/scenes/pull/928) ([@torkelo](https://github.com/torkelo) [@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.16.1 (Mon Sep 30 2024)

#### 🐛 Bug Fix

- useQueryRunner: Add more option props [#924](https://github.com/grafana/scenes/pull/924) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.15.0 (Wed Sep 25 2024)

#### 🐛 Bug Fix

- DataProviderProxy: Rename and fix imports [#911](https://github.com/grafana/scenes/pull/911) ([@torkelo](https://github.com/torkelo))
- DataProvideSharer: Add and export DataProviderSharer [#903](https://github.com/grafana/scenes/pull/903) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.13.0 (Wed Sep 04 2024)

### Release Notes

#### UrlSync: Support browser history steps, remove singleton ([#878](https://github.com/grafana/scenes/pull/878))

getUrlSyncManager is no longer exported as UrlSyncManager is now no longer global singleton but local to the UrlSyncContextProvider. 
If you called getUrlSyncManager().getUrlState that util function is available via the exported object sceneUtils.

---

#### 🚀 Enhancement

- UrlSync: Support browser history steps, remove singleton [#878](https://github.com/grafana/scenes/pull/878) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.10.2 (Wed Aug 28 2024)

#### 🐛 Bug Fix

- ScenesReact: Add datasource variable [#820](https://github.com/grafana/scenes/pull/820) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.10.1 (Tue Aug 20 2024)

#### 🐛 Bug Fix

- Add query variable in react-scenes [#818](https://github.com/grafana/scenes/pull/818) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.6.2 (Wed Jul 24 2024)

#### 🐛 Bug Fix

- ScenesReact: Add useVariableValue for single values [#821](https://github.com/grafana/scenes/pull/821) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.3.8 (Wed Jul 10 2024)

#### 🐛 Bug Fix

- Add more props + tests to CustomVariable [#817](https://github.com/grafana/scenes/pull/817) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.3.7 (Thu Jul 04 2024)

#### 🐛 Bug Fix

- Dependencies: Bump grafana packages to v11 [#802](https://github.com/grafana/scenes/pull/802) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.3.5 (Wed Jul 03 2024)

#### 🐛 Bug Fix

- React scenes: Annotations support [#782](https://github.com/grafana/scenes/pull/782) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.1.0 (Fri Jun 14 2024)

#### 🐛 Bug Fix

- ScenesReact: Use new react components and hooks from inside existing EmbeddedScenes [#777](https://github.com/grafana/scenes/pull/777) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.0.0 (Wed Jun 12 2024)

#### 💥 Breaking Change

- UrlSync: Major refactoring to simplify and make it work better across page routes (for scenes-react use case) [#765](https://github.com/grafana/scenes/pull/765) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.30.0 (Tue Jun 11 2024)

#### 🐛 Bug Fix

- React scenes: Add useDataTransformer hook [#775](https://github.com/grafana/scenes/pull/775) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.29.0 (Fri Jun 07 2024)

#### 🐛 Bug Fix

- ScenesReact: Make useVariableValues generic and rename VariableSelect to VariableControl [#778](https://github.com/grafana/scenes/pull/778) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.24.4 (Wed Jun 05 2024)

#### 🐛 Bug Fix

- PlainReact: Expose scene features through contexts and hooks and normal react components [#734](https://github.com/grafana/scenes/pull/734) ([@torkelo](https://github.com/torkelo) [@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

Work in progress 