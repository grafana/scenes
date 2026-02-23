# v6.57.0 (Mon Feb 23 2026)

#### 🚀 Enhancement

- Variables: Add a `ControlSourceRef` to the variable state [#1315](https://github.com/grafana/scenes/pull/1315) ([@leventebalogh](https://github.com/leventebalogh) [@mckn](https://github.com/mckn))

#### 🐛 Bug Fix

- Fix context macros [#1365](https://github.com/grafana/scenes/pull/1365) ([@harisrozajac](https://github.com/harisrozajac))

#### Authors: 3

- Haris Rozajac ([@harisrozajac](https://github.com/harisrozajac))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v6.56.0 (Fri Feb 20 2026)

#### 🚀 Enhancement

- FiltersOverview: Add a bulk validation method for origin filters [#1354](https://github.com/grafana/scenes/pull/1354) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.55.1 (Thu Feb 19 2026)

#### 🐛 Bug Fix

- GroupBy: Default to old key retrieval method [#1364](https://github.com/grafana/scenes/pull/1364) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.55.0 (Thu Feb 19 2026)

#### 🚀 Enhancement

- GroupByVariable: Use new DS API method [#1358](https://github.com/grafana/scenes/pull/1358) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.54.1 (Thu Feb 19 2026)

#### 🐛 Bug Fix

- Get datasource from queries if not on panel in `getQueriesForVariables` [#1352](https://github.com/grafana/scenes/pull/1352) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.54.0 (Wed Feb 18 2026)

#### 🚀 Enhancement

- scenes react: ad hoc filters, groupby, localvalue [#1353](https://github.com/grafana/scenes/pull/1353) ([@L2D2Grafana](https://github.com/L2D2Grafana))

#### 🐛 Bug Fix

- chore!: update peer dependencies of scenes packages [#1213](https://github.com/grafana/scenes/pull/1213) ([@NWRichmond](https://github.com/NWRichmond))
- chore: Remove output noise when launching unit tests [#1346](https://github.com/grafana/scenes/pull/1346) ([@grafakus](https://github.com/grafakus))

#### Authors: 3

- Liza Detrick ([@L2D2Grafana](https://github.com/L2D2Grafana))
- Marc M. ([@grafakus](https://github.com/grafakus))
- Nick Richmond ([@NWRichmond](https://github.com/NWRichmond))

---

# v6.53.0 (Tue Feb 17 2026)

#### 🚀 Enhancement

- AdHocFiltersVariable: add custom placeholder support [#1357](https://github.com/grafana/scenes/pull/1357) ([@matyax](https://github.com/matyax))

#### Authors: 1

- Matias Chomicki ([@matyax](https://github.com/matyax))

---

# v6.52.14 (Tue Feb 10 2026)

#### 🐛 Bug Fix

- QueryVariable: Deduplicate properties indices in toMetricFindValues [#1356](https://github.com/grafana/scenes/pull/1356) ([@grafakus](https://github.com/grafakus))

#### Authors: 1

- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.13 (Thu Feb 05 2026)

#### 🐛 Bug Fix

- Variables: Stricter input matching on options search [#1347](https://github.com/grafana/scenes/pull/1347) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.52.12 (Fri Jan 30 2026)

#### 🐛 Bug Fix

- SceneGridLayout: Remove height when grid is empty [#1344](https://github.com/grafana/scenes/pull/1344) ([@grafakus](https://github.com/grafakus))
- Adhoc filters: Don't escape filter values in Preview [#1343](https://github.com/grafana/scenes/pull/1343) ([@idastambuk](https://github.com/idastambuk))

#### Authors: 2

- Ida Štambuk ([@idastambuk](https://github.com/idastambuk))
- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.11 (Mon Jan 26 2026)

#### 🐛 Bug Fix

- AdHocFilters: Fixes backspace key not removing filters properly [#1339](https://github.com/grafana/scenes/pull/1339) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.52.10 (Wed Jan 21 2026)

#### 🐛 Bug Fix

- SceneQueryRunner: handle undefined state.data in cancelQuery [#1337](https://github.com/grafana/scenes/pull/1337) ([@kristinademeshchik](https://github.com/kristinademeshchik))

#### Authors: 1

- Kristina Demeshchik ([@kristinademeshchik](https://github.com/kristinademeshchik))

---

# v6.52.9 (Wed Jan 21 2026)

#### 🐛 Bug Fix

- QueryVariable: Ensure numeric value field is always added to MetricFindValue properties when parsing data frames [#1341](https://github.com/grafana/scenes/pull/1341) ([@grafakus](https://github.com/grafakus))

#### Authors: 1

- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.8 (Tue Jan 20 2026)

#### 🐛 Bug Fix

- QueryVariable: Allow numeric value fields in MetricFindValue parsing [#1338](https://github.com/grafana/scenes/pull/1338) ([@grafakus](https://github.com/grafakus))

#### Authors: 1

- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.7 (Mon Jan 19 2026)

#### 🐛 Bug Fix

- AdHocVar: Fix setting active index for grouped labels [#1335](https://github.com/grafana/scenes/pull/1335) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.52.6 (Mon Jan 19 2026)

#### 🐛 Bug Fix

- Filtering recommendations: Add subs to filters and grouping changes [#1334](https://github.com/grafana/scenes/pull/1334) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.52.5 (Mon Jan 19 2026)

#### 🐛 Bug Fix

- feat: add requestIdPrefix option to SceneQueryRunner [#1336](https://github.com/grafana/scenes/pull/1336) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v6.52.3 (Thu Jan 15 2026)

#### 🐛 Bug Fix

- CustomVariable: Preserve all JSON properties in options [#1332](https://github.com/grafana/scenes/pull/1332) ([@grafakus](https://github.com/grafakus))

#### Authors: 1

- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.2 (Tue Jan 13 2026)

#### 🐛 Bug Fix

- VizPanelMenuRenderer: Provide PanelMenuItem.target [#1331](https://github.com/grafana/scenes/pull/1331) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.52.1 (Tue Jan 06 2026)

#### 🐛 Bug Fix

- Variables: Fix text formatter for variables with multi-props [#1323](https://github.com/grafana/scenes/pull/1323) ([@grafakus](https://github.com/grafakus))
- DD: Change Switch variable ID to not overlap with the dashboard control label [#1324](https://github.com/grafana/scenes/pull/1324) ([@idastambuk](https://github.com/idastambuk))

#### Authors: 2

- Ida Štambuk ([@idastambuk](https://github.com/idastambuk))
- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.52.0 (Thu Dec 18 2025)

#### 🚀 Enhancement

- AdHocVariable: Add collapse button and clear all option [#1316](https://github.com/grafana/scenes/pull/1316) ([@harisrozajac](https://github.com/harisrozajac) [@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Haris Rozajac ([@harisrozajac](https://github.com/harisrozajac))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.51.0 (Thu Dec 18 2025)

#### 🚀 Enhancement

- Variables: Fix breaking behavior in toMetricFindValues [#1319](https://github.com/grafana/scenes/pull/1319) ([@torkelo](https://github.com/torkelo) [@grafakus](https://github.com/grafakus))

#### Authors: 2

- Marc M. ([@grafakus](https://github.com/grafakus))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.50.0 (Wed Dec 17 2025)

#### 🚀 Enhancement

- AdHocFilters/GroupBy: Support datasource drilldown recommendations and recent drilldowns [#1312](https://github.com/grafana/scenes/pull/1312) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- GroupBy: Variable UI optimisations [#1314](https://github.com/grafana/scenes/pull/1314) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.49.0 (Fri Dec 05 2025)

#### 🚀 Enhancement

- Introduce regexApplyTo variable field [#1306](https://github.com/grafana/scenes/pull/1306) ([@kristinademeshchik](https://github.com/kristinademeshchik))

#### Authors: 1

- Kristina Demeshchik ([@kristinademeshchik](https://github.com/kristinademeshchik))

---

# v6.48.1 (Thu Dec 04 2025)

### Release Notes

#### Dashboard: Round down invalid refresh interval ([#1310](https://github.com/grafana/scenes/pull/1310))

When a dashboard URL carried an invalid refresh value, the system previously defaulted the refresh interval to the minimum allowed value. This behaviour has now changed. Instead of jumping to the minimum interval, the refresh value is now rounded down to the nearest valid refresh interval.

---

#### 🐛 Bug Fix

- Dashboard: Round down invalid refresh interval [#1310](https://github.com/grafana/scenes/pull/1310) ([@kristinademeshchik](https://github.com/kristinademeshchik))
- fix: remove hardcoded values in sortVariableValues [#1307](https://github.com/grafana/scenes/pull/1307) ([@kristinademeshchik](https://github.com/kristinademeshchik))
- I18n: Download translations from Crowdin [#1298](https://github.com/grafana/scenes/pull/1298) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 3

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])
- Kristina Demeshchik ([@kristinademeshchik](https://github.com/kristinademeshchik))

---

# v6.48.0 (Mon Nov 24 2025)

#### 🚀 Enhancement

- Variables: support object values with multiple properties [#1236](https://github.com/grafana/scenes/pull/1236) ([@torkelo](https://github.com/torkelo) [@grafakus](https://github.com/grafakus))

#### Authors: 2

- Marc M. ([@grafakus](https://github.com/grafakus))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.47.1 (Wed Nov 19 2025)

#### 🐛 Bug Fix

- Drilldowns: Applicabilty check on drilldown variables [#1303](https://github.com/grafana/scenes/pull/1303) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.47.0 (Fri Nov 14 2025)

#### 🚀 Enhancement

- VizPanel: Do not pass empty array to titleItems [#1302](https://github.com/grafana/scenes/pull/1302) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.46.1 (Thu Nov 13 2025)

#### 🐛 Bug Fix

- MultiValueVariable: Fixes urlSync issues that caused wrong interpolation in queries [#1300](https://github.com/grafana/scenes/pull/1300) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.43.0 (Tue Nov 11 2025)

#### 🚀 Enhancement

- Filters: Add per-panel non-applicable pills [#1278](https://github.com/grafana/scenes/pull/1278) ([@mdvictor](https://github.com/mdvictor))
- AdhocFiltersVariable: Expose `originFilters` in links [#1297](https://github.com/grafana/scenes/pull/1297) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- Switch Variable: Add an id for the input [#1295](https://github.com/grafana/scenes/pull/1295) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 2

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.42.2 (Fri Oct 31 2025)

#### 🐛 Bug Fix

- I18n: Download translations from Crowdin [#1293](https://github.com/grafana/scenes/pull/1293) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 2

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])

---

# v6.42.1 (Thu Oct 30 2025)

#### 🐛 Bug Fix

- Data Layers: Add `placement` property [#1289](https://github.com/grafana/scenes/pull/1289) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v6.42.0 (Wed Oct 29 2025)

#### 🚀 Enhancement

- Decouple AdHocFiltersComboboxRenderer from AdHocFiltersVariable [#1272](https://github.com/grafana/scenes/pull/1272) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v6.41.0 (Wed Oct 29 2025)

#### 🚀 Enhancement

- Panel-level performance attribution system [#1265](https://github.com/grafana/scenes/pull/1265) ([@dprokop](https://github.com/dprokop) [@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- I18n: Download translations from Crowdin [#1291](https://github.com/grafana/scenes/pull/1291) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 4

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])
- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.40.1 (Thu Oct 23 2025)

#### 🐛 Bug Fix

- UrlTimeRangeMacro: Dashboard links not preserving browser timezone [#1279](https://github.com/grafana/scenes/pull/1279) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v6.40.0 (Thu Oct 23 2025)

#### 🚀 Enhancement

- UrlSyncManager: Fixes performance issue with unique key logic [#1281](https://github.com/grafana/scenes/pull/1281) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.39.9 (Thu Oct 23 2025)

#### 🐛 Bug Fix

- Internationalisation: Translate RefreshPicker text [#1282](https://github.com/grafana/scenes/pull/1282) ([@ashharrison90](https://github.com/ashharrison90))
- I18n: Download translations from Crowdin [#1251](https://github.com/grafana/scenes/pull/1251) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 3

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])
- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v6.39.8 (Thu Oct 16 2025)

#### 🐛 Bug Fix

- SceneGridLayout: Preserve float gridPos values [#1275](https://github.com/grafana/scenes/pull/1275) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v6.39.7 (Wed Oct 15 2025)

#### 🐛 Bug Fix

- SeneRenderProfiler: Remove tab inactive frame detection backup mechanism [#1276](https://github.com/grafana/scenes/pull/1276) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.39.6 (Wed Oct 15 2025)

#### 🐛 Bug Fix

- Fix rounding on old-style adhoc filters [#1271](https://github.com/grafana/scenes/pull/1271) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v6.39.5 (Fri Oct 10 2025)

#### 🐛 Bug Fix

- Annotations: Pass annotations through when transformations exist but none are annotations transformations [#1266](https://github.com/grafana/scenes/pull/1266) ([@fastfrwrd](https://github.com/fastfrwrd))

#### Authors: 1

- Paul Marbach ([@fastfrwrd](https://github.com/fastfrwrd))

---

# v6.39.4 (Fri Oct 10 2025)

#### 🐛 Bug Fix

- CustomVariable: Expose query parsing mechanism [#1269](https://github.com/grafana/scenes/pull/1269) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v6.39.3 (Thu Oct 09 2025)

#### 🐛 Bug Fix

- Variables: Introduce a new type called "switch" [#1258](https://github.com/grafana/scenes/pull/1258) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v6.39.2 (Wed Oct 08 2025)

#### 🐛 Bug Fix

- Chore: Fix annotations switch to work with new border radius [#1264](https://github.com/grafana/scenes/pull/1264) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v6.39.1 (Thu Sep 25 2025)

#### 🐛 Bug Fix

- fix: infinite focus loop [#1168](https://github.com/grafana/scenes/pull/1168) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v6.39.0 (Wed Sep 24 2025)

#### 🚀 Enhancement

- AdHocVariables: Show custom value first for `=~` and `!~` regex operators [#1250](https://github.com/grafana/scenes/pull/1250) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v6.38.0 (Fri Sep 19 2025)

#### 🚀 Enhancement

- SceneInteractionProfiler: Measure atomic selectbox interactions on adhocs and groupBy [#1240](https://github.com/grafana/scenes/pull/1240) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.37.0 (Fri Sep 19 2025)

#### 🚀 Enhancement

- SceneTimePicker: Pass move duration tooltip [#1248](https://github.com/grafana/scenes/pull/1248) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.36.0 (Thu Sep 18 2025)

#### 🚀 Enhancement

- Variables: Remove the `showInControlsMenu?` prop [#1249](https://github.com/grafana/scenes/pull/1249) ([@leventebalogh](https://github.com/leventebalogh))

#### 🐛 Bug Fix

- GroupByVariable: Do not show default value in url [#1242](https://github.com/grafana/scenes/pull/1242) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.35.3 (Mon Sep 15 2025)

#### 🐛 Bug Fix

- LazyLoading: Do not issue queries for panels outside view port [#1148](https://github.com/grafana/scenes/pull/1148) ([@torkelo](https://github.com/torkelo) [@bfmatei](https://github.com/bfmatei) [@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 3

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.35.2 (Mon Sep 15 2025)

#### 🐛 Bug Fix

- SceneRenderProfiler: Implement long frame detection with LoAF API and manual fallback [#1235](https://github.com/grafana/scenes/pull/1235) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.35.1 (Thu Sep 11 2025)

#### 🐛 Bug Fix

- Transformations: Support series <-> annotations conversions [#1207](https://github.com/grafana/scenes/pull/1207) ([@leeoniya](https://github.com/leeoniya) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Leon Sorokin ([@leeoniya](https://github.com/leeoniya))

---

# v6.35.0 (Wed Sep 10 2025)

#### 🚀 Enhancement

- SceneGridLayout: Use css class for wrapper [#1084](https://github.com/grafana/scenes/pull/1084) ([@torkelo](https://github.com/torkelo))
- export escapeUrlPipeDelimiters for esc-18160 and fix in metrics drilldown. [#1230](https://github.com/grafana/scenes/pull/1230) ([@bohandley](https://github.com/bohandley))

#### 🐛 Bug Fix

- SceneGridLayout: Adjust item y position for all children after a breakpoint [#1243](https://github.com/grafana/scenes/pull/1243) ([@oscarkilhed](https://github.com/oscarkilhed))
- Revert #1058 [#1245](https://github.com/grafana/scenes/pull/1245) ([@oscarkilhed](https://github.com/oscarkilhed))
- Fix pettier issue [#1244](https://github.com/grafana/scenes/pull/1244) ([@oscarkilhed](https://github.com/oscarkilhed))
- Patch 2 [#1058](https://github.com/grafana/scenes/pull/1058) ([@hoobtron](https://github.com/hoobtron))
- I18n: Download translations from Crowdin [#1193](https://github.com/grafana/scenes/pull/1193) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 6

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])
- [@hoobtron](https://github.com/hoobtron)
- Brendan O'Handley ([@bohandley](https://github.com/bohandley))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.34.0 (Wed Sep 03 2025)

#### 🚀 Enhancement

- SceneTimeRangeCompare: Export time shift as util [#1221](https://github.com/grafana/scenes/pull/1221) ([@drew08t](https://github.com/drew08t))

#### 🐛 Bug Fix

- Add SceneRenderProfiler integration tests [#1234](https://github.com/grafana/scenes/pull/1234) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Drew Slobodnjak ([@drew08t](https://github.com/drew08t))

---

# v6.33.0 (Tue Sep 02 2025)

#### 🚀 Enhancement

- Pass both filters and groupByKeys in annotation requests [#1232](https://github.com/grafana/scenes/pull/1232) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- GroupByVariable: Use new applicability method name and trigger it on groupBy blur [#1233](https://github.com/grafana/scenes/pull/1233) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.32.0 (Thu Aug 28 2025)

#### 🚀 Enhancement

- GroupBy: Non-applicable keys [#1192](https://github.com/grafana/scenes/pull/1192) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- AdHocFilters: Remove merging of different filter type with same keys [#1222](https://github.com/grafana/scenes/pull/1222) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.31.1 (Wed Aug 27 2025)

#### 🐛 Bug Fix

- SceneGridRow: Adjust row panel count to account for repeats [#1227](https://github.com/grafana/scenes/pull/1227) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v6.31.0 (Tue Aug 26 2025)

#### 🚀 Enhancement

- Feat: Add `showInControlsMenu` to `SceneVariableState` [#1208](https://github.com/grafana/scenes/pull/1208) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v6.30.4 (Mon Aug 25 2025)

#### 🐛 Bug Fix

- SceneRenderProfiler: Handle overlapping profiles by cancelling previous profile [#1225](https://github.com/grafana/scenes/pull/1225) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.30.3 (Mon Aug 25 2025)

#### 🐛 Bug Fix

- AdHocFilters: Fix hidden filters in new combobox layout [#1216](https://github.com/grafana/scenes/pull/1216) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.30.1 (Wed Aug 20 2025)

#### 🐛 Bug Fix

- DataLayers: Annotations can be enabled properly [#1219](https://github.com/grafana/scenes/pull/1219) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.30.0 (Wed Aug 20 2025)

#### 🚀 Enhancement

- VizPanel/SceneGridRow: Add repeatSourceKey to help simplify repeat handling [#1215](https://github.com/grafana/scenes/pull/1215) ([@torkelo](https://github.com/torkelo) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### 🐛 Bug Fix

- VizPanel: Add shouldMigrate() callback to migration logic [#1092](https://github.com/grafana/scenes/pull/1092) ([@leeoniya](https://github.com/leeoniya) [@adela-almasan](https://github.com/adela-almasan))
- ScenesDataTransformer: Allow passthrough set of ScopedVars to interpolate [#1200](https://github.com/grafana/scenes/pull/1200) ([@gelicia](https://github.com/gelicia))
- Add new operators to AdHocFiltersVariable [#1210](https://github.com/grafana/scenes/pull/1210) ([@joey-grafana](https://github.com/joey-grafana))

#### Authors: 6

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Adela Almasan ([@adela-almasan](https://github.com/adela-almasan))
- Joey ([@joey-grafana](https://github.com/joey-grafana))
- Kristina ([@gelicia](https://github.com/gelicia))
- Leon Sorokin ([@leeoniya](https://github.com/leeoniya))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.29.7 (Mon Aug 11 2025)

#### 🐛 Bug Fix

- SceneQueryController: Fix profiler query controller registration on scene re-activation [#1212](https://github.com/grafana/scenes/pull/1212) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.29.6 (Mon Aug 11 2025)

#### 🐛 Bug Fix

- SceneRenderProfler: Improve profiler accuracy by adding cancellation and skipping inactive tabs [#1211](https://github.com/grafana/scenes/pull/1211) ([@dprokop](https://github.com/dprokop))
- Chore: Decouple `hideFrom.viz` and `hideFrom.tooltip` [#1175](https://github.com/grafana/scenes/pull/1175) ([@adela-almasan](https://github.com/adela-almasan))

#### Authors: 2

- Adela Almasan ([@adela-almasan](https://github.com/adela-almasan))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.29.5 (Thu Aug 07 2025)

#### 🐛 Bug Fix

- SceneRenderProfiler: Only capture network requests within measurement window [#1209](https://github.com/grafana/scenes/pull/1209) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.29.4 (Wed Aug 06 2025)

#### 🐛 Bug Fix

- Chore: Use a proper version of `@grafana/i18n` now it's released [#1206](https://github.com/grafana/scenes/pull/1206) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v6.29.3 (Tue Aug 05 2025)

#### 🐛 Bug Fix

- AdHocFilters: Fix race conditions in non-applicable filters [#1203](https://github.com/grafana/scenes/pull/1203) ([@mdvictor](https://github.com/mdvictor))
- AdHocFilters: Scope injected filter values with regex operators also get merged [#1202](https://github.com/grafana/scenes/pull/1202) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.29.2 (Tue Aug 05 2025)

#### 🐛 Bug Fix

- SceneRenderProfiler: Handle tab inactivity [#1205](https://github.com/grafana/scenes/pull/1205) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.29.1 (Mon Aug 04 2025)

#### 🐛 Bug Fix

- AdHocFilters: Removing value from an origin filter will turn it into a matchAll filter [#1201](https://github.com/grafana/scenes/pull/1201) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.29.0 (Fri Aug 01 2025)

#### 🚀 Enhancement

- LazyLoader: Improve the lazy loading mechanism [#1197](https://github.com/grafana/scenes/pull/1197) ([@bfmatei](https://github.com/bfmatei) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v6.28.7 (Fri Aug 01 2025)

#### 🐛 Bug Fix

- VizPanel: Apply transformations returned by the migration handler [#1173](https://github.com/grafana/scenes/pull/1173) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v6.28.6 (Wed Jul 30 2025)

#### 🐛 Bug Fix

- SceneRenderProfiler: add start and end timestamps to profile events [#1199](https://github.com/grafana/scenes/pull/1199) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.28.5 (Wed Jul 30 2025)

#### 🐛 Bug Fix

- Make `SceneRenderProfiler` optional and injectable [#1198](https://github.com/grafana/scenes/pull/1198) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.28.4 (Tue Jul 29 2025)

#### 🐛 Bug Fix

- Add option to replace variable macros [#1196](https://github.com/grafana/scenes/pull/1196) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v6.28.3 (Tue Jul 29 2025)

#### 🐛 Bug Fix

- Enhance `SceneRenderProfiler` with additional interaction tracking [#1195](https://github.com/grafana/scenes/pull/1195) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v6.28.2 (Mon Jul 28 2025)

#### 🐛 Bug Fix

- Accessibility: Add `role="menuitem"` to `VizPanelMenu` items [#1189](https://github.com/grafana/scenes/pull/1189) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v6.28.1 (Thu Jul 24 2025)

#### 🐛 Bug Fix

- Custom variable: support newline separated options [#1191](https://github.com/grafana/scenes/pull/1191) ([@domasx2](https://github.com/domasx2))

#### Authors: 1

- Domas ([@domasx2](https://github.com/domasx2))

---

# v6.28.0 (Wed Jul 23 2025)

#### 🚀 Enhancement

- AdHocFilters: Show reason for non-applicable filters [#1181](https://github.com/grafana/scenes/pull/1181) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- I18n: Download translations from Crowdin [#1188](https://github.com/grafana/scenes/pull/1188) ([@github-actions[bot]](https://github.com/github-actions[bot]) [@ashharrison90](https://github.com/ashharrison90) [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot]))

#### Authors: 4

- [@github-actions[bot]](https://github.com/github-actions[bot])
- [@grafana-pr-automation[bot]](https://github.com/grafana-pr-automation[bot])
- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.27.3 (Wed Jul 23 2025)

#### 🐛 Bug Fix

- AdHocFiltersCombobox: Update z-index [#1166](https://github.com/grafana/scenes/pull/1166) ([@ashharrison90](https://github.com/ashharrison90))
- AdHocFilters: Refactor original values to take origin in key as well [#1185](https://github.com/grafana/scenes/pull/1185) ([@mdvictor](https://github.com/mdvictor))
- Time zone selection: When selecting Default in time zone picker, interpolate timezone from user profile setting [#1186](https://github.com/grafana/scenes/pull/1186) ([@harisrozajac](https://github.com/harisrozajac))

#### Authors: 3

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Haris Rozajac ([@harisrozajac](https://github.com/harisrozajac))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.27.2 (Wed Jul 09 2025)

#### 🐛 Bug Fix

- Add customqueryparam templating format for joining arrays with a custom separator [#1184](https://github.com/grafana/scenes/pull/1184) ([@joshhunt](https://github.com/joshhunt))
- Add join templating format for joining arrays with a custom separator [#1164](https://github.com/grafana/scenes/pull/1164) ([@joshhunt](https://github.com/joshhunt))
- TextBoxVariable: Support skipUrlSync [#1178](https://github.com/grafana/scenes/pull/1178) ([@harisrozajac](https://github.com/harisrozajac))
- chore: unify license change in #327 [#1137](https://github.com/grafana/scenes/pull/1137) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 3

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Haris Rozajac ([@harisrozajac](https://github.com/harisrozajac))
- Josh Hunt ([@joshhunt](https://github.com/joshhunt))

---

# v6.27.1 (Mon Jul 07 2025)

#### 🐛 Bug Fix

- QueryVariable: Add ability to provide custom static options [#1177](https://github.com/grafana/scenes/pull/1177) ([@domasx2](https://github.com/domasx2))
- MultiValueVariable: Support field path array index [#1172](https://github.com/grafana/scenes/pull/1172) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.27.0 (Wed Jul 02 2025)

#### 🚀 Enhancement

- TableNG: expose configured transparent value instead of false [#1171](https://github.com/grafana/scenes/pull/1171) ([@fastfrwrd](https://github.com/fastfrwrd))

#### Authors: 1

- Paul Marbach ([@fastfrwrd](https://github.com/fastfrwrd))

---

# v6.26.1 (Wed Jul 02 2025)

#### 🐛 Bug Fix

- Annotations: Don't run annotation query if it is disabled [#1174](https://github.com/grafana/scenes/pull/1174) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v6.26.0 (Fri Jun 27 2025)

#### 🚀 Enhancement

- SceneTimeRangeCompare: Add option to hide checkbox [#1157](https://github.com/grafana/scenes/pull/1157) ([@drew08t](https://github.com/drew08t))

#### Authors: 1

- Drew Slobodnjak ([@drew08t](https://github.com/drew08t))

---

# v6.25.0 (Thu Jun 26 2025)

#### 🚀 Enhancement

- AdHocFiltersVariable: Non-applicable filters [#1152](https://github.com/grafana/scenes/pull/1152) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.24.0 (Wed Jun 25 2025)

#### 🚀 Enhancement

- sceneGraph: findObject should return first match [#1165](https://github.com/grafana/scenes/pull/1165) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.23.0 (Wed Jun 25 2025)

#### 🚀 Enhancement

- feat(UrlSync): Allow namespacing when syncing the state of Scene variables with the URL search parameters [#1156](https://github.com/grafana/scenes/pull/1156) ([@grafakus](https://github.com/grafakus))

#### Authors: 1

- Marc M. ([@grafakus](https://github.com/grafakus))

---

# v6.22.1 (Tue Jun 24 2025)

#### 🐛 Bug Fix

- Annotations: Add scopes variable dependency [#1159](https://github.com/grafana/scenes/pull/1159) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v6.22.0 (Thu Jun 19 2025)

#### 🚀 Enhancement

- SceneQueryRunner: Detect local variable change [#1155](https://github.com/grafana/scenes/pull/1155) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.21.1 (Thu Jun 19 2025)

#### 🐛 Bug Fix

- i18n: fixes peer dependencies [#1162](https://github.com/grafana/scenes/pull/1162) ([@hugohaggmark](https://github.com/hugohaggmark))

#### Authors: 1

- Hugo Häggmark ([@hugohaggmark](https://github.com/hugohaggmark))

---

# v6.21.0 (Wed Jun 18 2025)

#### 🚀 Enhancement

- Internationalisation: Add markup for translations [#1151](https://github.com/grafana/scenes/pull/1151) ([@joshhunt](https://github.com/joshhunt))

#### 🐛 Bug Fix

- Update eslint to v9 [#1150](https://github.com/grafana/scenes/pull/1150) ([@joshhunt](https://github.com/joshhunt))

#### Authors: 1

- Josh Hunt ([@joshhunt](https://github.com/joshhunt))

---

# v6.20.2 (Mon Jun 16 2025)

#### 🐛 Bug Fix

- AdHocFiltersVariable: Fix scopes crashing when scope filters are undefined [#1153](https://github.com/grafana/scenes/pull/1153) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.20.1 (Mon Jun 16 2025)

#### 🐛 Bug Fix

- GroupBy: Fix edge cases on default values on dashboard load [#1146](https://github.com/grafana/scenes/pull/1146) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.20.0 (Mon Jun 16 2025)

#### 🚀 Enhancement

- AdHocVariable: Refactor origin filters [#1132](https://github.com/grafana/scenes/pull/1132) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- VariableDependencyConfig: Simplify bits and pieces [#1145](https://github.com/grafana/scenes/pull/1145) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.19.0 (Thu Jun 12 2025)

#### 🚀 Enhancement

- Scopes: Add annotation query support [#1144](https://github.com/grafana/scenes/pull/1144) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v6.18.1 (Wed Jun 04 2025)

#### 🐛 Bug Fix

- GroupBy: Fix edge cases on dashboard default values [#1142](https://github.com/grafana/scenes/pull/1142) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.18.0 (Tue Jun 03 2025)

#### 🚀 Enhancement

- ScopesVariable: Emit value changed when there no scopes selected [#1136](https://github.com/grafana/scenes/pull/1136) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Frontend: fix:recompute time range on timezone change in SceneTimeRange [#1135](https://github.com/grafana/scenes/pull/1135) ([@keerthanamsys](https://github.com/keerthanamsys))

#### Authors: 2

- [@keerthanamsys](https://github.com/keerthanamsys)
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.17.0 (Thu May 29 2025)

#### 🚀 Enhancement

- AdHocFiltersVariableUrlSyncHandler: fix url state containing `#` char [#1139](https://github.com/grafana/scenes/pull/1139) ([@gtk-grafana](https://github.com/gtk-grafana))

#### 🐛 Bug Fix

- SceneFlexItem: respect `wrap` property [#1111](https://github.com/grafana/scenes/pull/1111) ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v6.16.0 (Wed May 28 2025)

#### 🚀 Enhancement

- ScopesVariable: Fixes diff check issue [#1134](https://github.com/grafana/scenes/pull/1134) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.15.0 (Tue May 27 2025)

#### 🚀 Enhancement

- ScopesVariable: Only compare scope names [#1131](https://github.com/grafana/scenes/pull/1131) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.14.0 (Mon May 26 2025)

#### 🚀 Enhancement

- ScopesVariable: Only emit value changed when value has changed [#1130](https://github.com/grafana/scenes/pull/1130) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.13.0 (Thu May 22 2025)

#### 🚀 Enhancement

- GroupByVariable: Add support for default values [#1122](https://github.com/grafana/scenes/pull/1122) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.12.0 (Fri May 16 2025)

### Release Notes

#### Scopes: Replace ScopesBridge with ScopesVariable ([#1121](https://github.com/grafana/scenes/pull/1121))

SceneScopesBridge is now replaced by ScopesVariable, which now needs to be added to a SceneVariableSet attached to every SceneAppPage or EmbeddedScene (whatever suits your scenario) where you want to use scopes. This variable is not visible in the UI. You can control whether scopes are enabled or disabled on a specific page/scene using the ScopesVariable or control this on a higher level using ScopesContext.

sceneGraph.getScopesBridge is replaced by sceneGraph.getScopes, which just returns the scopes (by looking up the ScopesVariable and getting it from it's value).

---

#### 🚀 Enhancement

- Scopes: Replace ScopesBridge with ScopesVariable [#1121](https://github.com/grafana/scenes/pull/1121) ([@torkelo](https://github.com/torkelo) [@tskarhed](https://github.com/tskarhed))

#### 🐛 Bug Fix

- README: Explain usage of the "release" label [#1126](https://github.com/grafana/scenes/pull/1126) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 2

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.11.1 (Thu May 15 2025)

#### 🐛 Bug Fix

- VizPanel: Allow passing partial state when cloning [#1127](https://github.com/grafana/scenes/pull/1127) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v6.11.0 (Thu May 15 2025)

#### 🚀 Enhancement

- VizPanel: Cloning should ignore pluginInstanceState [#1124](https://github.com/grafana/scenes/pull/1124) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- VizPanelBuilders: Update failing snapshot test [#1123](https://github.com/grafana/scenes/pull/1123) ([@torkelo](https://github.com/torkelo))
- SceneTimePicker: Add defaultQuickRanges to override the default time range options [#1113](https://github.com/grafana/scenes/pull/1113) ([@joshhunt](https://github.com/joshhunt) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 3

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Josh Hunt ([@joshhunt](https://github.com/joshhunt))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.10.4 (Thu May 08 2025)

#### 🐛 Bug Fix

- AdHocVariable: Add more suggestive injected filters tooltips [#1118](https://github.com/grafana/scenes/pull/1118) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.10.3 (Tue May 06 2025)

#### 🐛 Bug Fix

- AdHocFiltersCombobox: Read-only filters improvements [#1115](https://github.com/grafana/scenes/pull/1115) ([@adrapereira](https://github.com/adrapereira))
- SceneTimeRange: Fix calculatePercentOfInterval [#1101](https://github.com/grafana/scenes/pull/1101) ([@edvard-falkskar](https://github.com/edvard-falkskar))
- Tighten repo security [#1116](https://github.com/grafana/scenes/pull/1116) ([@mdvictor](https://github.com/mdvictor))
- fix: GroupBy Select receives null [#1112](https://github.com/grafana/scenes/pull/1112) ([@joannaWebDev](https://github.com/joannaWebDev))

#### Authors: 4

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))
- Edvard Falkskär ([@edvard-falkskar](https://github.com/edvard-falkskar))
- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.10.2 (Thu Apr 24 2025)

#### 🐛 Bug Fix

- Use log util. Direct console.warn fails tests in grafana. [#1110](https://github.com/grafana/scenes/pull/1110) ([@scottlepp](https://github.com/scottlepp))

#### Authors: 1

- Scott Lepper ([@scottlepp](https://github.com/scottlepp))

---

# v6.10.1 (Thu Apr 24 2025)

#### 🐛 Bug Fix

- Validate timezone [#1109](https://github.com/grafana/scenes/pull/1109) ([@scottlepp](https://github.com/scottlepp))

#### Authors: 1

- Scott Lepper ([@scottlepp](https://github.com/scottlepp))

---

# v6.10.0 (Thu Apr 24 2025)

#### 🚀 Enhancement

- AdHocFilters: Dashboard level filters [#1095](https://github.com/grafana/scenes/pull/1095) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- Revert "Variables: Notify scene objects in depth order" [#1108](https://github.com/grafana/scenes/pull/1108) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.9.1 (Wed Apr 23 2025)

#### 🐛 Bug Fix

- Variables: Notify scene objects in depth order [#1104](https://github.com/grafana/scenes/pull/1104) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.9.0 (Thu Apr 17 2025)

#### 🚀 Enhancement

- fix: (VizPanelRenderer) - move showMenuAlways prop to the top level [#1093](https://github.com/grafana/scenes/pull/1093) ([@L2D2Grafana](https://github.com/L2D2Grafana))

#### Authors: 1

- Liza Detrick ([@L2D2Grafana](https://github.com/L2D2Grafana))

---

# v6.8.1 (Fri Apr 11 2025)

### Release Notes

#### Variables: Rename renderSelectForVariable to MultiOrSingleValueSelect ([#1097](https://github.com/grafana/scenes/pull/1097))

RenderSelectForVariable was renamed to MultiOrSingleValueSelect and is now React component.

---

#### 🐛 Bug Fix

- Variables: Rename renderSelectForVariable to MultiOrSingleValueSelect [#1097](https://github.com/grafana/scenes/pull/1097) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.8.0 (Fri Apr 11 2025)

#### 🚀 Enhancement

- Variables: Switch between multi and single select if state changes [#1096](https://github.com/grafana/scenes/pull/1096) ([@torkelo](https://github.com/torkelo))
- ConstantVariable: Support interpolation and dependency of other variables in constant value [#1094](https://github.com/grafana/scenes/pull/1094) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.7.0 (Wed Apr 09 2025)

#### 🚀 Enhancement

- VariableControl: Add props needed in core dashboards [#1091](https://github.com/grafana/scenes/pull/1091) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.6.3 (Fri Apr 04 2025)

#### 🐛 Bug Fix

- GroupByVariable: Add browser history action support for GroupBy var [#1087](https://github.com/grafana/scenes/pull/1087) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.6.2 (Wed Apr 02 2025)

#### 🐛 Bug Fix

- AdHocFilters: Fix issue where scope injected filter would not update properly [#1085](https://github.com/grafana/scenes/pull/1085) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.6.1 (Tue Apr 01 2025)

#### 🐛 Bug Fix

- Bump rollup and related deps [#1077](https://github.com/grafana/scenes/pull/1077) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v6.6.0 (Mon Mar 24 2025)

#### 🚀 Enhancement

- Combobox: Support individual read-only filters [#1081](https://github.com/grafana/scenes/pull/1081) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v6.5.3 (Fri Mar 21 2025)

#### 🐛 Bug Fix

- Remove url sync from ScopesBridge [#1080](https://github.com/grafana/scenes/pull/1080) ([@aocenas](https://github.com/aocenas))

#### Authors: 1

- Andrej Ocenas ([@aocenas](https://github.com/aocenas))

---

# v6.5.2 (Thu Mar 20 2025)

#### 🐛 Bug Fix

- Scopes: Fix panels stuck in loading on scopes remove [#1079](https://github.com/grafana/scenes/pull/1079) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.5.1 (Thu Mar 20 2025)

#### 🐛 Bug Fix

- AdHocFilters: Fix removing all scopes and cleaning up the adhoc [#1078](https://github.com/grafana/scenes/pull/1078) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.5.0 (Wed Mar 19 2025)

#### 🚀 Enhancement

- AdHocVariable: Edit injected filters [#1062](https://github.com/grafana/scenes/pull/1062) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.4.1 (Wed Mar 19 2025)

#### 🐛 Bug Fix

- AdhocVariable: Inject scopes in baseFilters [#1073](https://github.com/grafana/scenes/pull/1073) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.4.0 (Wed Mar 19 2025)

#### 🚀 Enhancement

- fix: explore button to preserve datasource selection in mixed datasource panels [#1074](https://github.com/grafana/scenes/pull/1074) ([@joannaWebDev](https://github.com/joannaWebDev))

#### Authors: 1

- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))

---

# v6.3.1 (Tue Mar 11 2025)

#### 🐛 Bug Fix

- Scopes: Add `ScopesBridge` object [#990](https://github.com/grafana/scenes/pull/990) ([@bfmatei](https://github.com/bfmatei) [@tskarhed](https://github.com/tskarhed) [@aocenas](https://github.com/aocenas) [@mdvictor](https://github.com/mdvictor))

#### Authors: 4

- Andrej Ocenas ([@aocenas](https://github.com/aocenas))
- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.3.0 (Fri Mar 07 2025)

#### 🚀 Enhancement

- Variables: Fix for data source variable support [#1069](https://github.com/grafana/scenes/pull/1069) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.2.1 (Thu Mar 06 2025)

#### 🐛 Bug Fix

- Variables: Unify options filtering to use most up to date implementation [#1071](https://github.com/grafana/scenes/pull/1071) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v6.2.0 (Wed Mar 05 2025)

#### 🚀 Enhancement

- SceneObjectBase: Fixes crash TypeError circular reference when stringifying scene object [#1070](https://github.com/grafana/scenes/pull/1070) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.1.4 (Thu Feb 27 2025)

#### 🐛 Bug Fix

- AdhocVariable: `baseFilters` with origin appear readonly in the UI [#1060](https://github.com/grafana/scenes/pull/1060) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.1.3 (Wed Feb 26 2025)

#### 🐛 Bug Fix

- Profiling: explicitly set profiling names [#1063](https://github.com/grafana/scenes/pull/1063) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v6.1.2 (Wed Feb 26 2025)

#### 🐛 Bug Fix

- Utils: Spread objects in cloneSceneObjectState [#967](https://github.com/grafana/scenes/pull/967) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v6.1.1 (Mon Feb 24 2025)

#### 🐛 Bug Fix

- SceneGridLayout: Allow to hook into `onDragStart` event [#1059](https://github.com/grafana/scenes/pull/1059) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v6.1.0 (Thu Feb 20 2025)

#### 🚀 Enhancement

- UrlSync: Variable changes adds browser history steps [#882](https://github.com/grafana/scenes/pull/882) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Fallback page: fix infinite loop [#1057](https://github.com/grafana/scenes/pull/1057) ([@domasx2](https://github.com/domasx2))
- Fix issue were operators do not appear properly in adhoc vars [#1054](https://github.com/grafana/scenes/pull/1054) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 3

- Domas ([@domasx2](https://github.com/domasx2))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v6.0.2 (Thu Feb 13 2025)

#### 🐛 Bug Fix

- Fix the `getLegacyPanelId` method in `VizPanel` [#1053](https://github.com/grafana/scenes/pull/1053) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v6.0.1 (Mon Feb 10 2025)

#### 🐛 Bug Fix

- SceneDataTransformer: Interpolate transformation options [#1051](https://github.com/grafana/scenes/pull/1051) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v6.0.0 (Fri Feb 07 2025)

#### 💥 Breaking Change

- Update to `react-router@6` [#979](https://github.com/grafana/scenes/pull/979) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v5.42.0 (Thu Feb 06 2025)

#### 🚀 Enhancement

- Themes: Fixes variable labels to support border radius [#1050](https://github.com/grafana/scenes/pull/1050) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.41.3 (Thu Feb 06 2025)

#### 🐛 Bug Fix

- SceneTimePicker: Add support for custom quick ranges [#1048](https://github.com/grafana/scenes/pull/1048) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.41.2 (Tue Feb 04 2025)

#### 🐛 Bug Fix

- Variables: Prevent queries from runners which are not specific to the query runner datasource [#1044](https://github.com/grafana/scenes/pull/1044) ([@bfmatei](https://github.com/bfmatei))
- MultiValueVariable: Add `getDefaultSingleState` method [#1035](https://github.com/grafana/scenes/pull/1035) ([@domasx2](https://github.com/domasx2))
- Dependencies: Bump Grafana packages to v11.5 [#1040](https://github.com/grafana/scenes/pull/1040) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 3

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Domas ([@domasx2](https://github.com/domasx2))
- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v5.41.1 (Thu Jan 30 2025)

#### 🐛 Bug Fix

- LazyLoader: Prevent empty panels from not being hidden [#1039](https://github.com/grafana/scenes/pull/1039) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v5.41.0 (Tue Jan 28 2025)

#### 🚀 Enhancement

- Fix issue with custom variables losing URL value when there are no options [#1033](https://github.com/grafana/scenes/pull/1033) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.40.0 (Tue Jan 28 2025)

#### 🚀 Enhancement

- SceneVariableSet: Allow propagation of variable changes through local variable [#1030](https://github.com/grafana/scenes/pull/1030) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Combobox: Displaying value instead of valueLabels on edit [#1036](https://github.com/grafana/scenes/pull/1036) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 2

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.39.0 (Mon Jan 27 2025)

#### 🚀 Enhancement

- AdHocFilters: allow setting filter meta in getTagKeysProvider [#1034](https://github.com/grafana/scenes/pull/1034) ([@gtk-grafana](https://github.com/gtk-grafana))

#### 🐛 Bug Fix

- feat: when allowCustomValue is false, do not show the regex operators [#1031](https://github.com/grafana/scenes/pull/1031) ([@joannaWebDev](https://github.com/joannaWebDev))

#### Authors: 2

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))

---

# v5.38.0 (Wed Jan 22 2025)

#### 🚀 Enhancement

- Layouts: Add ability to hook into VizPanelRenderer events [#1028](https://github.com/grafana/scenes/pull/1028) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.37.1 (Wed Jan 22 2025)

#### 🐛 Bug Fix

- AdHocFilterVariable: Force option label to be a string [#1029](https://github.com/grafana/scenes/pull/1029) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.37.0 (Tue Jan 14 2025)

#### 🚀 Enhancement

- sceneUtils: export methods for generating scenes URLs in external applications [#1024](https://github.com/grafana/scenes/pull/1024) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v5.36.4 (Fri Jan 10 2025)

#### 🐛 Bug Fix

- Scenes performance: Measurement [#858](https://github.com/grafana/scenes/pull/858) ([@dprokop](https://github.com/dprokop) [@oscarkilhed](https://github.com/oscarkilhed))
- Variables: current value [#1005](https://github.com/grafana/scenes/pull/1005) ([@yincongcyincong](https://github.com/yincongcyincong))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- jackyin ([@yincongcyincong](https://github.com/yincongcyincong))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.36.3 (Wed Jan 08 2025)

#### 🐛 Bug Fix

- ScenesQueryRunner: Add minInterval to variable dependencies [#1021](https://github.com/grafana/scenes/pull/1021) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))
- AdHocFilters: add hidden option [#1012](https://github.com/grafana/scenes/pull/1012) ([@mikkancso](https://github.com/mikkancso))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Miklós Tolnai ([@mikkancso](https://github.com/mikkancso))

---

# v5.36.2 (Thu Jan 02 2025)

#### 🐛 Bug Fix

- QueryVariable: Use correct option property for variable options sorting [#1015](https://github.com/grafana/scenes/pull/1015) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.36.1 (Tue Dec 31 2024)

#### 🐛 Bug Fix

- AdHocFilters: Fix matching non-latin template vars in filter [#1018](https://github.com/grafana/scenes/pull/1018) ([@leeoniya](https://github.com/leeoniya))

#### Authors: 1

- Leon Sorokin ([@leeoniya](https://github.com/leeoniya))

---

# v5.36.0 (Fri Dec 20 2024)

### Release Notes

#### AdHocFiltersVariable: provide updateFilters method to allow updating filters without emitting SceneVariableValueChangedEvent ([#1004](https://github.com/grafana/scenes/pull/1004))

New AdHocFiltersVariable method `updateFilters` to allow updating filters state. Allows skipping emit of `SceneVariableValueChangedEvent` to prevent filter changes from notifying dependent scene objects.

---

#### 🚀 Enhancement

- AdHocFiltersVariable: provide updateFilters method to allow updating filters without emitting SceneVariableValueChangedEvent [#1004](https://github.com/grafana/scenes/pull/1004) ([@gtk-grafana](https://github.com/gtk-grafana))

#### 🐛 Bug Fix

- fix: groupBy manual applyMode [#1010](https://github.com/grafana/scenes/pull/1010) ([@joannaWebDev](https://github.com/joannaWebDev))
- remove .only from test [#1008](https://github.com/grafana/scenes/pull/1008) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 3

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))

---

# v5.35.0 (Wed Dec 18 2024)

#### 🚀 Enhancement

- SceneTimeRange: Set weekstart when evaluating time range [#1007](https://github.com/grafana/scenes/pull/1007) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Variables: Interpolate datasource uid when used with datasource variable [#996](https://github.com/grafana/scenes/pull/996) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.34.0 (Tue Dec 17 2024)

#### 🚀 Enhancement

- Variables: Add datasource variable support [#1006](https://github.com/grafana/scenes/pull/1006) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v5.33.0 (Mon Dec 16 2024)

#### 🚀 Enhancement

- SceneTimeRange: Fixes weekstart issue when evaluting data math [#1002](https://github.com/grafana/scenes/pull/1002) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- fix: wrap groupBy single-select value in an array [#1000](https://github.com/grafana/scenes/pull/1000) ([@joannaWebDev](https://github.com/joannaWebDev))

#### Authors: 2

- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.32.0 (Fri Dec 13 2024)

#### 🚀 Enhancement

- Supply fixed now to datemath caluclations [#981](https://github.com/grafana/scenes/pull/981) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.31.0 (Thu Dec 12 2024)

#### 🐛 Bug Fix

- GroupBy: Add <Select /> for single selection option [#983](https://github.com/grafana/scenes/pull/983) ([@joannaWebDev](https://github.com/joannaWebDev))

#### Authors: 1

- Joanna ([@joannaWebDev](https://github.com/joannaWebDev))

---

# v5.30.0 (Tue Dec 10 2024)

#### 🚀 Enhancement

- VizPanel: Set selectionId for PanelChrome [#997](https://github.com/grafana/scenes/pull/997) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.29.0 (Thu Dec 05 2024)

#### 🚀 Enhancement

- AdHocFiltersCombobox - Improve filter editing behaviour when pre-filling value on edit [#992](https://github.com/grafana/scenes/pull/992) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))
- Variables: Fixes issue when variable value was null [#985](https://github.com/grafana/scenes/pull/985) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Prettier/lint: Add prettier and lint check to CI , format all files with prettier [#988](https://github.com/grafana/scenes/pull/988) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.28.1 (Fri Nov 29 2024)

#### 🐛 Bug Fix

- AdHocFiltersCombobox: Prevent updating combobox options when input type changed during fetch [#982](https://github.com/grafana/scenes/pull/982) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.28.0 (Fri Nov 29 2024)

#### 🚀 Enhancement

- VizPanel: Limit series feature [#978](https://github.com/grafana/scenes/pull/978) ([@torkelo](https://github.com/torkelo) [@gtk-grafana](https://github.com/gtk-grafana))

#### 🐛 Bug Fix

- Chore: Bump grafana dependencies [#965](https://github.com/grafana/scenes/pull/965) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 3

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.27.0 (Wed Nov 27 2024)

#### 🚀 Enhancement

- SceneObject: Render before activation [#968](https://github.com/grafana/scenes/pull/968) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.26.1 (Wed Nov 27 2024)

#### 🐛 Bug Fix

- Add missing parameter to patchGetAdhocFilters.ts [#970](https://github.com/grafana/scenes/pull/970) ([@lunaticusgreen](https://github.com/lunaticusgreen))

#### Authors: 1

- Roman Misyurin ([@lunaticusgreen](https://github.com/lunaticusgreen))

---

# v5.26.0 (Mon Nov 25 2024)

#### 🚀 Enhancement

- Add `allowCustomValue` flag to `GroupByVariable` [#974](https://github.com/grafana/scenes/pull/974) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.25.1 (Wed Nov 20 2024)

#### 🐛 Bug Fix

- Annotations: Fix issue where dashboard annotations weren't rendering [#964](https://github.com/grafana/scenes/pull/964) ([@kaydelaney](https://github.com/kaydelaney))
- Variables: Fix search result ordering to use match quality [#969](https://github.com/grafana/scenes/pull/969) ([@leeoniya](https://github.com/leeoniya))
- SceneVariableSet: Notify scene objects that use time macros when time changes [#966](https://github.com/grafana/scenes/pull/966) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Leon Sorokin ([@leeoniya](https://github.com/leeoniya))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.25.0 (Wed Nov 13 2024)

#### 🚀 Enhancement

- Chore: Relax dependencies and move e2e-selectors to peerDeps [#940](https://github.com/grafana/scenes/pull/940) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v5.24.0 (Tue Nov 12 2024)

#### 🚀 Enhancement

- Variables: Add new `allowCustomValue` flag to MultiVariables [#956](https://github.com/grafana/scenes/pull/956) ([@mdvictor](https://github.com/mdvictor))

#### 🐛 Bug Fix

- Add VizPanelExploreButton scene object [#804](https://github.com/grafana/scenes/pull/804) ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.23.4 (Fri Nov 08 2024)

#### 🐛 Bug Fix

- New filters UI: adds some basic unit tests [#958](https://github.com/grafana/scenes/pull/958) ([@ashharrison90](https://github.com/ashharrison90) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.23.3 (Fri Nov 08 2024)

#### 🐛 Bug Fix

- VariableLabel: change variable label check to OR instead of ?? [#963](https://github.com/grafana/scenes/pull/963) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))
- GroupByVariable: Support custom filter keys [#865](https://github.com/grafana/scenes/pull/865) ([@andreaalopez](https://github.com/andreaalopez))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Andrea Lopez ([@andreaalopez](https://github.com/andreaalopez))

---

# v5.23.2 (Fri Nov 08 2024)

#### 🐛 Bug Fix

- Variables: Saved default all value with non multi select fix [#959](https://github.com/grafana/scenes/pull/959) ([@torkelo](https://github.com/torkelo))
- ScenesReact: Cache SceneQueryRunners and other scene object by a key / hashing string [#788](https://github.com/grafana/scenes/pull/788) ([@torkelo](https://github.com/torkelo) [@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.23.1 (Wed Nov 06 2024)

#### 🐛 Bug Fix

- AdHocFiltersCombobox - Pre-fill filter combobox value on edit [#955](https://github.com/grafana/scenes/pull/955) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.23.0 (Tue Nov 05 2024)

#### 🚀 Enhancement

- VizPanel: Adjust forceRender logic [#954](https://github.com/grafana/scenes/pull/954) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.22.2 (Tue Nov 05 2024)

#### 🐛 Bug Fix

- SceneTimeRange: Fix passing timezone URL parameter [#947](https://github.com/grafana/scenes/pull/947) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v5.22.1 (Mon Nov 04 2024)

#### 🐛 Bug Fix

- SceneObject: Cloning with state fix [#953](https://github.com/grafana/scenes/pull/953) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.22.0 (Mon Nov 04 2024)

#### 🚀 Enhancement

- VizPanel: Do not refresh color mode on `changePluginType` if plugin is the same [#950](https://github.com/grafana/scenes/pull/950) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.21.2 (Fri Nov 01 2024)

#### 🐛 Bug Fix

- Don't run migration when changing panel plugin [#952](https://github.com/grafana/scenes/pull/952) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.21.1 (Thu Oct 31 2024)

#### 🐛 Bug Fix

- AdHocFilterCombobox: Improve backspace functionality to delete filter key, operator and values separately [#942](https://github.com/grafana/scenes/pull/942) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))
- VariableValueInput: Set max width [#948](https://github.com/grafana/scenes/pull/948) ([@harisrozajac](https://github.com/harisrozajac))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Haris Rozajac ([@harisrozajac](https://github.com/harisrozajac))

---

# v5.21.0 (Tue Oct 29 2024)

#### 🚀 Enhancement

- SceneObject: Improve cloning logic [#944](https://github.com/grafana/scenes/pull/944) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.20.4 (Wed Oct 23 2024)

#### 🐛 Bug Fix

- feat: sort adhoc filter options using ufuzzy [#941](https://github.com/grafana/scenes/pull/941) ([@sd2k](https://github.com/sd2k))

#### Authors: 1

- Ben Sully ([@sd2k](https://github.com/sd2k))

---

# v5.20.3 (Tue Oct 22 2024)

#### 🐛 Bug Fix

- AdHocFiltersCombobox: adjust combobox filter values when switching between multi and single operators [#927](https://github.com/grafana/scenes/pull/927) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.20.2 (Wed Oct 16 2024)

#### 🐛 Bug Fix

- TimeRange: Fix timezone not being sync with url [#939](https://github.com/grafana/scenes/pull/939) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v5.20.0 (Thu Oct 10 2024)

#### 🚀 Enhancement

- VizPanel: Fix issue where changing panel options wouldn't cause re-render [#934](https://github.com/grafana/scenes/pull/934) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.19.1 (Wed Oct 09 2024)

#### 🐛 Bug Fix

- Fix a crash when refresh interval set to empty string [#933](https://github.com/grafana/scenes/pull/933) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.19.0 (Wed Oct 09 2024)

#### 🚀 Enhancement

- PanelBuilders: Mixin function to share config [#932](https://github.com/grafana/scenes/pull/932) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.18.3 (Tue Oct 08 2024)

#### 🐛 Bug Fix

- Add checks for valid dates before saving calculating values [#914](https://github.com/grafana/scenes/pull/914) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 1

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v5.18.2 (Mon Oct 07 2024)

#### 🐛 Bug Fix

- Interpolation: Fixes queryparam variable format when used with adhoc filter variable [#931](https://github.com/grafana/scenes/pull/931) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.18.0 (Fri Oct 04 2024)

#### 🚀 Enhancement

- Emit RefreshEvent on annotation enable/disable [#930](https://github.com/grafana/scenes/pull/930) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.17.0 (Fri Oct 04 2024)

#### 🚀 Enhancement

- Annotations: Include templateSrv.getVariables with dashboard object in legacy annotation queries [#929](https://github.com/grafana/scenes/pull/929) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.16.3 (Thu Oct 03 2024)

#### 🐛 Bug Fix

- Refresh: Improve / harden refresh url sync [#923](https://github.com/grafana/scenes/pull/923) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.16.2 (Tue Oct 01 2024)

#### 🐛 Bug Fix

- Combobox: Fix "Apply" button positioning when scrolling [#918](https://github.com/grafana/scenes/pull/918) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.16.1 (Mon Sep 30 2024)

#### 🐛 Bug Fix

- useQueryRunner: Add more option props [#924](https://github.com/grafana/scenes/pull/924) ([@torkelo](https://github.com/torkelo))
- Fix row title styling for large titles [#920](https://github.com/grafana/scenes/pull/920) ([@mdvictor](https://github.com/mdvictor))
- Fix showing all value in datalinks when linking to another db and including vars [#919](https://github.com/grafana/scenes/pull/919) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.16.0 (Wed Sep 25 2024)

#### 🚀 Enhancement

- SceneTimePicker: Implement recently used absolute time ranges view [#915](https://github.com/grafana/scenes/pull/915) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.15.1 (Wed Sep 25 2024)

#### 🐛 Bug Fix

- SceneTimeRange: Fixes inconsistent representation of time range [#907](https://github.com/grafana/scenes/pull/907) ([@torkelo](https://github.com/torkelo))
- Use locationService from context in UrlSyncManager [#899](https://github.com/grafana/scenes/pull/899) ([@aocenas](https://github.com/aocenas))

#### Authors: 2

- Andrej Ocenas ([@aocenas](https://github.com/aocenas))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.15.0 (Wed Sep 25 2024)

#### 🚀 Enhancement

- SceneTimeRange: Use new weekStart prop on TimeRangePicker [#910](https://github.com/grafana/scenes/pull/910) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- DataProviderProxy: Rename and fix imports [#911](https://github.com/grafana/scenes/pull/911) ([@torkelo](https://github.com/torkelo))
- DataProvideSharer: Add and export DataProviderSharer [#903](https://github.com/grafana/scenes/pull/903) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.14.7 (Fri Sep 13 2024)

#### 🐛 Bug Fix

- AdHocVariable: Don't throw when operator is not found [#898](https://github.com/grafana/scenes/pull/898) ([@ashharrison90](https://github.com/ashharrison90))
- Adhoc filters: Add descriptions for all operators [#901](https://github.com/grafana/scenes/pull/901) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.14.4 (Fri Sep 13 2024)

#### 🐛 Bug Fix

- Add toggle all option to variable value select [#876](https://github.com/grafana/scenes/pull/876) ([@oscarkilhed](https://github.com/oscarkilhed))
- Include isMulti and includeAll in LocalValueVariable [#900](https://github.com/grafana/scenes/pull/900) ([@oscarkilhed](https://github.com/oscarkilhed))
- MultiValueVariabe: Change when value changed event is published [#896](https://github.com/grafana/scenes/pull/896) ([@mdvictor](https://github.com/mdvictor))
- Demo: Demonstrate event traversal through scene graph [#848](https://github.com/grafana/scenes/pull/848) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 3

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.14.3 (Wed Sep 11 2024)

#### 🐛 Bug Fix

- SceneObjectBase: add clearParent [#892](https://github.com/grafana/scenes/pull/892) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.14.2 (Mon Sep 09 2024)

#### 🐛 Bug Fix

- AdHocFilters - multi value support in new filters UI [#889](https://github.com/grafana/scenes/pull/889) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov) [@ashharrison90](https://github.com/ashharrison90))
- Revert "SceneObjectBase: Support rendering a child out of context" [#891](https://github.com/grafana/scenes/pull/891) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.14.1 (Thu Sep 05 2024)

#### 🐛 Bug Fix

- TextBoxVariable: fixes issues with TextBox variable when being updated by URL [#890](https://github.com/grafana/scenes/pull/890) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.14.0 (Thu Sep 05 2024)

#### 🚀 Enhancement

- SceneObjectBase: Support rendering a child out of context [#887](https://github.com/grafana/scenes/pull/887) ([@torkelo](https://github.com/torkelo))

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

#### 🐛 Bug Fix

- chore: export SceneDataTransformerState [#888](https://github.com/grafana/scenes/pull/888) ([@jewbetcha](https://github.com/jewbetcha))

#### Authors: 2

- Coleman Rollins ([@jewbetcha](https://github.com/jewbetcha))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.12.0 (Tue Sep 03 2024)

#### 🚀 Enhancement

- SceneTimeRange: Support initialize time range with time and time.window [#886](https://github.com/grafana/scenes/pull/886) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.11.2 (Mon Sep 02 2024)

#### 🐛 Bug Fix

- Make SceneRefreshPicker respect config.minRefreshInterval [#877](https://github.com/grafana/scenes/pull/877) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.11.1 (Fri Aug 30 2024)

#### 🐛 Bug Fix

- AdHocFiltersVariable - new ad hoc filters UI [#830](https://github.com/grafana/scenes/pull/830) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov) [@bfmatei](https://github.com/bfmatei))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v5.11.0 (Thu Aug 29 2024)

#### 🚀 Enhancement

- AdHocFilters: Add support for new `isOneOf` multi value operator [#868](https://github.com/grafana/scenes/pull/868) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.10.2 (Wed Aug 28 2024)

#### 🐛 Bug Fix

- Allow auto refresh only if tab is visible [#879](https://github.com/grafana/scenes/pull/879) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.10.1 (Tue Aug 20 2024)

#### 🐛 Bug Fix

- MultiValueVariable: Fix issue where url update would not take options into account [#874](https://github.com/grafana/scenes/pull/874) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.10.0 (Mon Aug 19 2024)

### Release Notes

#### SafeSerializableSceneObject: Wrap only for supported Grafana version ([#854](https://github.com/grafana/scenes/pull/854))

Brings a fix for [variables interpolation bug](https://github.com/grafana/scenes/issues/851) when apps using scenes 5.6.0+ were run in Grafana version lower than 11.2.0, 11.1.2, 11.0.4, 10.4.8.

---

#### 🚀 Enhancement

- SafeSerializableSceneObject: Wrap only for supported Grafana version [#854](https://github.com/grafana/scenes/pull/854) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v5.9.1 (Mon Aug 19 2024)

#### 🐛 Bug Fix

- PanelAttention: Fix delay [#867](https://github.com/grafana/scenes/pull/867) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v5.9.0 (Fri Aug 16 2024)

#### 🚀 Enhancement

- SceneQueryRunner: Manual control over query execution [#334](https://github.com/grafana/scenes/pull/334) ([@torkelo](https://github.com/torkelo) [@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 2

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.8.0 (Thu Aug 15 2024)

#### 🚀 Enhancement

- SceneGridLayout: Change to useMeasure and non absolute div wrapper [#872](https://github.com/grafana/scenes/pull/872) ([@torkelo](https://github.com/torkelo) [@ashharrison90](https://github.com/ashharrison90))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.7.5 (Wed Aug 14 2024)

#### 🐛 Bug Fix

- Possibility to refresh variable options based on state changes [#827](https://github.com/grafana/scenes/pull/827) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.7.4 (Fri Aug 09 2024)

#### 🐛 Bug Fix

- Add backwards compatibility for query variables referencing themselves [#861](https://github.com/grafana/scenes/pull/861) ([@oscarkilhed](https://github.com/oscarkilhed) [@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v5.7.3 (Thu Aug 01 2024)

#### 🐛 Bug Fix

- AdHocFilters: Support custom filter keys [#857](https://github.com/grafana/scenes/pull/857) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.7.2 (Wed Jul 31 2024)

#### 🐛 Bug Fix

- VizPanel: React to RefreshEvent for non-data changes [#852](https://github.com/grafana/scenes/pull/852) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.7.1 (Wed Jul 31 2024)

#### 🐛 Bug Fix

- SceneVariableSet: Update all variables in case of error [#850](https://github.com/grafana/scenes/pull/850) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.7.0 (Mon Jul 29 2024)

#### 🚀 Enhancement

- Allow setting \_skipOnLayoutChange in SceneGridLayout [#849](https://github.com/grafana/scenes/pull/849) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.6.2 (Wed Jul 24 2024)

#### 🐛 Bug Fix

- SafeSerializableSceneObject: Make sure valueOf is bound to the instance [#844](https://github.com/grafana/scenes/pull/844) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v5.6.1 (Mon Jul 22 2024)

#### 🐛 Bug Fix

- SceneTimeRange: Allow time range refresh on activation [#835](https://github.com/grafana/scenes/pull/835) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v5.6.0 (Fri Jul 19 2024)

#### 🚀 Enhancement

- Wrap \_\_sceneObject scoped var in an serialisable wrapper [#828](https://github.com/grafana/scenes/pull/828) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v5.5.1 (Thu Jul 18 2024)

#### 🐛 Bug Fix

- Add triggering RefreshEvent on time range refresh [#838](https://github.com/grafana/scenes/pull/838) ([@asimonok](https://github.com/asimonok))

#### Authors: 1

- Alex Simonok ([@asimonok](https://github.com/asimonok))

---

# v5.5.0 (Thu Jul 18 2024)

#### 🚀 Enhancement

- Scenes: Move change panel plugin logic in VizPanel [#836](https://github.com/grafana/scenes/pull/836) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.4.1 (Thu Jul 18 2024)

#### 🐛 Bug Fix

- QueryVariable: Query is empty string by default [#837](https://github.com/grafana/scenes/pull/837) ([@ivanortegaalba](https://github.com/ivanortegaalba))
- fix(lazyloader): fix trying to run inexistent callbacks [#833](https://github.com/grafana/scenes/pull/833) ([@svennergr](https://github.com/svennergr))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v5.4.0 (Tue Jul 16 2024)

#### 🚀 Enhancement

- Adhoc filters/Group by: Support groups [#816](https://github.com/grafana/scenes/pull/816) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.3.9 (Tue Jul 16 2024)

#### 🐛 Bug Fix

- Add variable dependency config to SceneGridRow [#832](https://github.com/grafana/scenes/pull/832) ([@kaydelaney](https://github.com/kaydelaney))
- VizPanelRenderer: Set attention with onMouseEnter [#831](https://github.com/grafana/scenes/pull/831) ([@tskarhed](https://github.com/tskarhed))
- LazyLoader: add use of `useStyles2` and improve name [#825](https://github.com/grafana/scenes/pull/825) ([@svennergr](https://github.com/svennergr))

#### Authors: 3

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Sven Grossmann ([@svennergr](https://github.com/svennergr))
- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v5.3.8 (Wed Jul 10 2024)

#### 🐛 Bug Fix

- LazyLoader: Hide wrapper if child is hidden [#823](https://github.com/grafana/scenes/pull/823) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v5.3.7 (Thu Jul 04 2024)

#### 🐛 Bug Fix

- Dependencies: Bump grafana packages to v11 [#802](https://github.com/grafana/scenes/pull/802) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.3.6 (Wed Jul 03 2024)

#### 🐛 Bug Fix

- Adhoc filters: Fix regression with displaying groups [#815](https://github.com/grafana/scenes/pull/815) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v5.3.5 (Wed Jul 03 2024)

#### 🐛 Bug Fix

- Revert "SceneRefreshPicker: Fixes url state issue (#784)" [#814](https://github.com/grafana/scenes/pull/814) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v5.3.4 (Tue Jul 02 2024)

#### 🐛 Bug Fix

- Revert "VizPanel: Load plugin prefered default options when activating" [#812](https://github.com/grafana/scenes/pull/812) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.3.3 (Tue Jul 02 2024)

#### 🐛 Bug Fix

- Fix variable interpolation in query options interval [#810](https://github.com/grafana/scenes/pull/810) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.3.2 (Thu Jun 27 2024)

#### 🐛 Bug Fix

- VizPanel: Load plugin prefered default options when activating [#806](https://github.com/grafana/scenes/pull/806) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.3.1 (Wed Jun 26 2024)

#### 🐛 Bug Fix

- VizPanel: Allow to adapt color palette after plugin change [#805](https://github.com/grafana/scenes/pull/805) ([@ivanortegaalba](https://github.com/ivanortegaalba))
- TimeRangeCompare: Do not re-run queries if all have opted out of comparison [#799](https://github.com/grafana/scenes/pull/799) ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.3.0 (Mon Jun 24 2024)

#### 🚀 Enhancement

- Add `toAbsolute` method to SceneTimePicker [#800](https://github.com/grafana/scenes/pull/800) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v5.2.1 (Fri Jun 21 2024)

#### 🐛 Bug Fix

- VizPanel: Clear options value when the option is undefined [#801](https://github.com/grafana/scenes/pull/801) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v5.2.0 (Thu Jun 20 2024)

#### 🚀 Enhancement

- SceneAppPage: add PageLayoutType 'layout' prop [#798](https://github.com/grafana/scenes/pull/798) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v5.1.2 (Wed Jun 19 2024)

#### 🐛 Bug Fix

- Scenes: Return value if not string in interpolator [#796](https://github.com/grafana/scenes/pull/796) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.1.1 (Wed Jun 19 2024)

#### 🐛 Bug Fix

- VariableValueSelect: Hardcode flaky Select option e2e-selector [#797](https://github.com/grafana/scenes/pull/797) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.1.0 (Fri Jun 14 2024)

#### 🚀 Enhancement

- Add support for new getTagKeys/getTagValues interface [#790](https://github.com/grafana/scenes/pull/790) ([@kaydelaney](https://github.com/kaydelaney))

#### 🐛 Bug Fix

- ScenesReact: Use new react components and hooks from inside existing EmbeddedScenes [#777](https://github.com/grafana/scenes/pull/777) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.0.3 (Thu Jun 13 2024)

#### 🐛 Bug Fix

- Data layers: Don't run layer on activation if disabled [#795](https://github.com/grafana/scenes/pull/795) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v5.0.2 (Thu Jun 13 2024)

#### 🐛 Bug Fix

- UrlSync: Remove console.log left in prev PR [#794](https://github.com/grafana/scenes/pull/794) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.0.1 (Thu Jun 13 2024)

#### 🐛 Bug Fix

- UrlSync: Fixes issue with recent url sync change [#793](https://github.com/grafana/scenes/pull/793) ([@torkelo](https://github.com/torkelo))
- SceneQueryRunner: When waiting for a variable to load, and PanelData is undefined, we should create a valid PanelData object. [#791](https://github.com/grafana/scenes/pull/791) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.0.0 (Wed Jun 12 2024)

#### 💥 Breaking Change

- UrlSync: Major refactoring to simplify and make it work better across page routes (for scenes-react use case) [#765](https://github.com/grafana/scenes/pull/765) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.32.0 (Tue Jun 11 2024)

#### 🚀 Enhancement

- AdHocFiltersVariable: Show operator in vertical mode [#783](https://github.com/grafana/scenes/pull/783) ([@ivanahuckova](https://github.com/ivanahuckova))

#### Authors: 1

- Ivana Huckova ([@ivanahuckova](https://github.com/ivanahuckova))

---

# v4.31.0 (Tue Jun 11 2024)

#### 🚀 Enhancement

- Variables: Fixes sceneInterpolator when string contains variables with object prototype function names [#785](https://github.com/grafana/scenes/pull/785) ([@torkelo](https://github.com/torkelo))
- SceneRefreshPicker: Fixes url state issue [#784](https://github.com/grafana/scenes/pull/784) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.30.0 (Tue Jun 11 2024)

#### 🚀 Enhancement

- Variables: Add support to read only variables and expose missing types for custom variables in core grafana [#781](https://github.com/grafana/scenes/pull/781) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v4.29.0 (Fri Jun 07 2024)

#### 🚀 Enhancement

- Introduce enrichFiltersRequest [#779](https://github.com/grafana/scenes/pull/779) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.28.0 (Fri Jun 07 2024)

#### 🚀 Enhancement

- SceneQueryRunner: Do not set panelId by default [#776](https://github.com/grafana/scenes/pull/776) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- provide an option to hide the label from the variable value controller [#769](https://github.com/grafana/scenes/pull/769) ([@eskirk](https://github.com/eskirk))

#### Authors: 2

- Elliot Kirk ([@eskirk](https://github.com/eskirk))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.27.0 (Thu Jun 06 2024)

#### 🚀 Enhancement

- AdHocFiltersVariable: Performance improvements [#766](https://github.com/grafana/scenes/pull/766) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.26.3 (Thu Jun 06 2024)

#### 🐛 Bug Fix

- VariableValueSelect: Adjust data-testid in OptionWithCheckbox [#770](https://github.com/grafana/scenes/pull/770) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.26.2 (Thu Jun 06 2024)

#### 🐛 Bug Fix

- Variables: Support variable expressions inside custom values [#774](https://github.com/grafana/scenes/pull/774) ([@torkelo](https://github.com/torkelo))
- SceneQueryRunner: Act as if we're loading when waiting for variables to load. [#768](https://github.com/grafana/scenes/pull/768) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.26.1 (Wed Jun 05 2024)

#### 🐛 Bug Fix

- PlainReact: Expose scene features through contexts and hooks and normal react components [#734](https://github.com/grafana/scenes/pull/734) ([@torkelo](https://github.com/torkelo) [@oscarkilhed](https://github.com/oscarkilhed))
- SceneQueryRunner: decouple time range comparisons [#587](https://github.com/grafana/scenes/pull/587) ([@sd2k](https://github.com/sd2k))

#### Authors: 3

- Ben Sully ([@sd2k](https://github.com/sd2k))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.26.0 (Tue Jun 04 2024)

#### 🚀 Enhancement

- Variables: Search / typing performance improvements [#763](https://github.com/grafana/scenes/pull/763) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.25.0 (Fri May 31 2024)

#### 🚀 Enhancement

- AdHoc filters: Add support for adhoc filter value groups [#758](https://github.com/grafana/scenes/pull/758) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.24.4 (Thu May 30 2024)

#### 🐛 Bug Fix

- VizPanelRenderer: Emit SetPanelAttention event [#716](https://github.com/grafana/scenes/pull/716) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v4.24.3 (Thu May 30 2024)

#### 🐛 Bug Fix

- Macros: Resolve browser timezone for `$__timezone` [#759](https://github.com/grafana/scenes/pull/759) ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Variables: Prioritize showing adhoc variable key and operator [#750](https://github.com/grafana/scenes/pull/750) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.24.2 (Wed May 29 2024)

#### 🐛 Bug Fix

- MultiValueVariable: Fixes issue when value is all value but all value is not enabled [#757](https://github.com/grafana/scenes/pull/757) ([@torkelo](https://github.com/torkelo) [@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.24.1 (Tue May 28 2024)

#### 🐛 Bug Fix

- Allow drag and dropping rows in valid states [#756](https://github.com/grafana/scenes/pull/756) ([@mdvictor](https://github.com/mdvictor))
- fix: undefined check on RefreshPicker.autoOption [#751](https://github.com/grafana/scenes/pull/751) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 2

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.24.0 (Mon May 27 2024)

#### 🚀 Enhancement

- SceneFlexLayout: Min width/height option was ignored [#749](https://github.com/grafana/scenes/pull/749) ([@edvard-falkskar](https://github.com/edvard-falkskar))

#### Authors: 1

- Edvard Falkskär ([@edvard-falkskar](https://github.com/edvard-falkskar))

---

# v4.23.1 (Wed May 22 2024)

#### 🐛 Bug Fix

- VariableValueSelect: Add missing data-testids for e2e [#742](https://github.com/grafana/scenes/pull/742) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.23.0 (Mon May 20 2024)

#### 🚀 Enhancement

- MultiValueVariable: Fixes setting value from url when url value is a custom all value [#738](https://github.com/grafana/scenes/pull/738) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.22.0 (Wed May 15 2024)

#### 🚀 Enhancement

- Performance: Limit data layer state updates [#724](https://github.com/grafana/scenes/pull/724) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.21.1 (Tue May 14 2024)

#### 🐛 Bug Fix

- Group by: Do not allow custom options [#736](https://github.com/grafana/scenes/pull/736) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.21.0 (Tue May 14 2024)

#### 🚀 Enhancement

- SceneVariableSet: Do not propagate variable value changes when a local variable has the same name [#729](https://github.com/grafana/scenes/pull/729) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- NestedScene: Don't show `cursor: pointer;` for everything [#735](https://github.com/grafana/scenes/pull/735) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.20.0 (Mon May 13 2024)

#### 🚀 Enhancement

- GroupByVariable: Sync label to URL [#705](https://github.com/grafana/scenes/pull/705) ([@bfmatei](https://github.com/bfmatei))
- Typescript: Enable strict mode [#728](https://github.com/grafana/scenes/pull/728) ([@torkelo](https://github.com/torkelo))
- SceneGridLayout: Prevent panels from moving on mount [#733](https://github.com/grafana/scenes/pull/733) ([@torkelo](https://github.com/torkelo) [@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 3

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.19.0 (Fri May 10 2024)

#### 🚀 Enhancement

- SceneDataTransformer: Performance optimizations [#725](https://github.com/grafana/scenes/pull/725) ([@torkelo](https://github.com/torkelo))
- Variables: Do not update value when value and text are the same [#726](https://github.com/grafana/scenes/pull/726) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.18.0 (Fri May 10 2024)

#### 🚀 Enhancement

- SceneQueryRunner: Detect new variable values when cloned [#727](https://github.com/grafana/scenes/pull/727) ([@torkelo](https://github.com/torkelo))
- SceneObject: Handle new or removed behaviors [#731](https://github.com/grafana/scenes/pull/731) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.17.3 (Thu May 09 2024)

#### 🐛 Bug Fix

- AdHoc filters: Allow typing the same custom value [#723](https://github.com/grafana/scenes/pull/723) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.2 (Thu May 09 2024)

#### 🐛 Bug Fix

- AdHocFilters: clear filter value when key is changed [#714](https://github.com/grafana/scenes/pull/714) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.1 (Wed May 08 2024)

#### 🐛 Bug Fix

- AdHoc filters: Apply `isKeysOpen` state changes synchronously [#722](https://github.com/grafana/scenes/pull/722) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.0 (Wed May 08 2024)

#### 🚀 Enhancement

- VariableSelect: Multi select design update and behavior improvements [#709](https://github.com/grafana/scenes/pull/709) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.16.0 (Wed May 08 2024)

#### 🚀 Enhancement

- Types: Export `FieldConfigOverridesBuilder` [#719](https://github.com/grafana/scenes/pull/719) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v4.15.0 (Wed May 08 2024)

#### 🚀 Enhancement

- SceneDataTransformer: Fixes transformer emitting untransformed series [#720](https://github.com/grafana/scenes/pull/720) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.14.2 (Tue May 07 2024)

#### 🐛 Bug Fix

- AdHoc filters: Allow adding custom value while loading [#721](https://github.com/grafana/scenes/pull/721) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.14.1 (Tue May 07 2024)

#### 🐛 Bug Fix

- Allow filter selectors to wrap [#715](https://github.com/grafana/scenes/pull/715) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.14.0 (Fri May 03 2024)

#### 🚀 Enhancement

- AdHocFiltersVariable: create an opt-in state variable for using queries to filter the options [#713](https://github.com/grafana/scenes/pull/713) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 1

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))

---

# v4.13.2 (Wed May 01 2024)

#### 🐛 Bug Fix

- MultiValueVariable: Fixes support for legacy All url value [#712](https://github.com/grafana/scenes/pull/712) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.13.1 (Wed May 01 2024)

#### 🐛 Bug Fix

- Chore: Bump various dependencies [#682](https://github.com/grafana/scenes/pull/682) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.13.0 (Fri Apr 26 2024)

#### 🚀 Enhancement

- sceneGraph: handle interpolations argument in interpolate [#708](https://github.com/grafana/scenes/pull/708) ([@sd2k](https://github.com/sd2k))

#### Authors: 1

- Ben Sully ([@sd2k](https://github.com/sd2k))

---

# v4.12.3 (Wed Apr 24 2024)

#### 🐛 Bug Fix

- Dashboard Migration: Add missing e2e selectors to some components [#648](https://github.com/grafana/scenes/pull/648) ([@axelavargas](https://github.com/axelavargas) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v4.12.2 (Wed Apr 24 2024)

#### 🐛 Bug Fix

- SceneQueryRunner: Support detecting new local time range [#707](https://github.com/grafana/scenes/pull/707) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.12.1 (Tue Apr 23 2024)

#### 🐛 Bug Fix

- Fix how the submenus appear for menus of type group [#704](https://github.com/grafana/scenes/pull/704) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.12.0 (Tue Apr 23 2024)

#### 🚀 Enhancement

- VizPanel: Fixes issue updating instanceState [#702](https://github.com/grafana/scenes/pull/702) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.11.3 (Mon Apr 22 2024)

#### 🐛 Bug Fix

- AdhocFilters: Show label for selected key [#690](https://github.com/grafana/scenes/pull/690) ([@ashharrison90](https://github.com/ashharrison90) [@bfmatei](https://github.com/bfmatei))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.11.2 (Mon Apr 22 2024)

#### 🐛 Bug Fix

- GroupBy: Fetch options when opening menu [#687](https://github.com/grafana/scenes/pull/687) ([@ashharrison90](https://github.com/ashharrison90) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.11.1 (Wed Apr 17 2024)

#### 🐛 Bug Fix

- Interval variable: Make interval variable properly update on name change [#701](https://github.com/grafana/scenes/pull/701) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.11.0 (Wed Apr 17 2024)

#### 🚀 Enhancement

- Fix ${\_\_all_variables} not updating their value in panels [#698](https://github.com/grafana/scenes/pull/698) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v4.10.0 (Wed Apr 17 2024)

#### 🚀 Enhancement

- RefreshPicker: Fixed width when going betwen normal and loading state [#695](https://github.com/grafana/scenes/pull/695) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.9.0 (Tue Apr 16 2024)

#### 🚀 Enhancement

- Annotations: Don't always execute annotations on activate [#635](https://github.com/grafana/scenes/pull/635) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.8.0 (Mon Apr 15 2024)

#### 🚀 Enhancement

- LocalValueVariable: Do not throw when missing parent variable [#691](https://github.com/grafana/scenes/pull/691) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.7.0 (Mon Apr 15 2024)

#### 🚀 Enhancement

- SceneComponentWrapper: More robust activation [#692](https://github.com/grafana/scenes/pull/692) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.6.0 (Wed Apr 10 2024)

#### 🚀 Enhancement

- SceneObjectBase: useState add options that make the new activation behavior optional [#688](https://github.com/grafana/scenes/pull/688) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.5.7 (Wed Apr 10 2024)

#### 🐛 Bug Fix

- Filters/GroupBy: Resolve queries only from active query runners [#685](https://github.com/grafana/scenes/pull/685) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.5.6 (Tue Apr 09 2024)

#### 🐛 Bug Fix

- VizPanel: Allow configuring hover header offset [#674](https://github.com/grafana/scenes/pull/674) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.5.5 (Tue Apr 09 2024)

#### 🐛 Bug Fix

- AdHocFiltersVariable: Fixes issue updating hide state causing variable to be deactivated and preventing it from being shown again [#679](https://github.com/grafana/scenes/pull/679) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.5.4 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- Clone SceneQueryRunner together with \_results [#681](https://github.com/grafana/scenes/pull/681) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.5.3 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- SceneRefreshPicker: Show the auto calculated value when auto is selected [#680](https://github.com/grafana/scenes/pull/680) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.5.2 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- Disallow drag and drop rows within uncollapsed rows [#671](https://github.com/grafana/scenes/pull/671) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.5.1 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- Chore: Bump typescript version [#657](https://github.com/grafana/scenes/pull/657) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.5.0 (Fri Apr 05 2024)

#### 🚀 Enhancement

- VizPanel: Do not apply the visualization's field config to annotation data frames [#659](https://github.com/grafana/scenes/pull/659) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 1

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v4.4.1 (Thu Apr 04 2024)

#### 🐛 Bug Fix

- Chore: Remove viz panel tooltip related code that is no longer needed [#675](https://github.com/grafana/scenes/pull/675) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.4.0 (Thu Apr 04 2024)

#### 🚀 Enhancement

- SceneRefreshPicker: Implement mechanism for auto interval [#667](https://github.com/grafana/scenes/pull/667) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.3.0 (Wed Apr 03 2024)

#### 🚀 Enhancement

- AdHoc Filters: Allow custom value [#670](https://github.com/grafana/scenes/pull/670) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.2.1 (Wed Apr 03 2024)

#### 🐛 Bug Fix

- LiveNowTimer: The constructor doesn't receive a valid state [#662](https://github.com/grafana/scenes/pull/662) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v4.2.0 (Tue Apr 02 2024)

#### 🚀 Enhancement

- Autofit: Fit widget in the screen depending on the height [#658](https://github.com/grafana/scenes/pull/658) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v4.1.2 (Tue Apr 02 2024)

#### 🐛 Bug Fix

- Fix issue where curly braces are always added to IntervalMacro. [#666](https://github.com/grafana/scenes/pull/666) ([@oscarkilhed](https://github.com/oscarkilhed))
- AdHocFiltersVariable/GroupByVariable: Pass time range to getTagKeys calls [#665](https://github.com/grafana/scenes/pull/665) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 2

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.1.1 (Tue Apr 02 2024)

#### 🐛 Bug Fix

- Fix drag and drop panels in rows [#663](https://github.com/grafana/scenes/pull/663) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.1.0 (Tue Apr 02 2024)

#### 🚀 Enhancement

- AdHocFiltersVariable: Pass scene queries to getTagValues calls [#664](https://github.com/grafana/scenes/pull/664) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.0.4 (Wed Mar 27 2024)

#### 🐛 Bug Fix

- Check if target datasource is matching the panel ds, if not set the target ds to panel ds. [#660](https://github.com/grafana/scenes/pull/660) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.0.3 (Fri Mar 22 2024)

#### 🐛 Bug Fix

- MultiValueVariable: Fixes issue with initial url sync when using old All url value [#656](https://github.com/grafana/scenes/pull/656) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.0.2 (Fri Mar 22 2024)

#### 🐛 Bug Fix

- ControlsLabel: style: use info icons for description [#654](https://github.com/grafana/scenes/pull/654) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 1

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))

---

# v4.0.1 (Thu Mar 21 2024)

#### 🐛 Bug Fix

- SceneQueryRunner: Meaningful cloning [#652](https://github.com/grafana/scenes/pull/652) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.0.0 (Thu Mar 21 2024)

#### 💥 Breaking Change

- DataLayers: Unifiy DataLayers (group of data layers) and a single data layer [#640](https://github.com/grafana/scenes/pull/640) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.14.0 (Wed Mar 20 2024)

#### 🚀 Enhancement

- Add transformations to annotations dataframes [#651](https://github.com/grafana/scenes/pull/651) ([@javiruiz01](https://github.com/javiruiz01))
- Add ability to opt out specifc queries from time window comparison [#650](https://github.com/grafana/scenes/pull/650) ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v3.13.3 (Fri Mar 15 2024)

#### 🐛 Bug Fix

- AdHocFilter: Correctly show the label for a matching default key [#645](https://github.com/grafana/scenes/pull/645) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v3.13.2 (Fri Mar 15 2024)

#### 🐛 Bug Fix

- SceneGridLayout: Fixes moving panels when opening dashboards [#644](https://github.com/grafana/scenes/pull/644) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.13.1 (Thu Mar 14 2024)

#### 🐛 Bug Fix

- VizPanel: Fixes incrementing structureRev [#643](https://github.com/grafana/scenes/pull/643) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.13.0 (Wed Mar 13 2024)

#### 🚀 Enhancement

- LiveNow: Move enabled property to state [#642](https://github.com/grafana/scenes/pull/642) ([@kaydelaney](https://github.com/kaydelaney))

#### 🐛 Bug Fix

- LiveNow: Fixes activation/deactivation issue and logic error with getTimeRange [#641](https://github.com/grafana/scenes/pull/641) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v3.12.0 (Mon Mar 11 2024)

#### 🚀 Enhancement

- PanelMigrations: Fixes incorrect panel.id in migration handler [#638](https://github.com/grafana/scenes/pull/638) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.11.0 (Mon Mar 11 2024)

#### 🚀 Enhancement

- Variables: Support static keys in AdHocFiltersVariable [#612](https://github.com/grafana/scenes/pull/612) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v3.10.1 (Mon Mar 11 2024)

#### 🐛 Bug Fix

- Variables: Fixes issue with url sync and key value variables [#639](https://github.com/grafana/scenes/pull/639) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.10.0 (Thu Mar 07 2024)

#### 🚀 Enhancement

- Variables: Maintain custom (invalid) variable values set via URL on initial load [#632](https://github.com/grafana/scenes/pull/632) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- LiveNow: Fix broken behavior [#637](https://github.com/grafana/scenes/pull/637) ([@kaydelaney](https://github.com/kaydelaney))
- Scenes: Implement "Live now" feature [#618](https://github.com/grafana/scenes/pull/618) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.9.2 (Wed Mar 06 2024)

#### 🐛 Bug Fix

- VizPanel: Fixes issue updating field config [#636](https://github.com/grafana/scenes/pull/636) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.9.1 (Tue Mar 05 2024)

#### 🐛 Bug Fix

- VariableDependencyConfig: Fixes support for explicit dependencies and scanned dependencies [#630](https://github.com/grafana/scenes/pull/630) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.9.0 (Tue Mar 05 2024)

### Release Notes

#### SceneObjectBase: Call self activation handlers before child data, time range and variable handlers ([#628](https://github.com/grafana/scenes/pull/628))

Activation handlers are for a scene object is now called before any direct child activation handlers. Before this release the activation handlers of direction $data, $timeRange, $variables and $behaviors was called before the SceneObjects own activation handlers.

---

#### 🚀 Enhancement

- SceneObjectBase: Call self activation handlers before child data, time range and variable handlers [#628](https://github.com/grafana/scenes/pull/628) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.8.2 (Mon Mar 04 2024)

#### 🐛 Bug Fix

- Rows are draggable when scene layout is draggable [#626](https://github.com/grafana/scenes/pull/626) ([@mdvictor](https://github.com/mdvictor))
- Style rows to show actions on entire group hover [#625](https://github.com/grafana/scenes/pull/625) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v3.8.1 (Wed Feb 28 2024)

#### 🐛 Bug Fix

- Group row title and actions together on the left side [#624](https://github.com/grafana/scenes/pull/624) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v3.8.0 (Mon Feb 26 2024)

#### 🚀 Enhancement

- AdHocFilters: Auto focus value when key is selected [#614](https://github.com/grafana/scenes/pull/614) ([@torkelo](https://github.com/torkelo) [@darrenjaneczek](https://github.com/darrenjaneczek))

#### 🐛 Bug Fix

- feat: allow label for adhoc filter add button [#619](https://github.com/grafana/scenes/pull/619) ([@darrenjaneczek](https://github.com/darrenjaneczek))
- fix: adhoc filter placeholder to "Select value" [#620](https://github.com/grafana/scenes/pull/620) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 2

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.7.0 (Fri Feb 23 2024)

#### 🚀 Enhancement

- VizPanel: Pass container width to data provider always [#611](https://github.com/grafana/scenes/pull/611) ([@torkelo](https://github.com/torkelo))
- SceneObjectBase: Minor optimization to setParent [#610](https://github.com/grafana/scenes/pull/610) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Legend sorting fix [#616](https://github.com/grafana/scenes/pull/616) ([@xforman2](https://github.com/xforman2))

#### Authors: 2

- [@xforman2](https://github.com/xforman2)
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.6.1 (Tue Feb 20 2024)

#### 🐛 Bug Fix

- VizPanel: Fixes issue with non memoizable PanelData [#609](https://github.com/grafana/scenes/pull/609) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.6.0 (Mon Feb 19 2024)

#### 🚀 Enhancement

- Update grafana peer dependencies [#570](https://github.com/grafana/scenes/pull/570) ([@leventebalogh](https://github.com/leventebalogh) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.5.0 (Wed Feb 14 2024)

#### 🚀 Enhancement

- SceneQueryRunner: Add query caching options [#603](https://github.com/grafana/scenes/pull/603) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v3.4.1 (Wed Feb 14 2024)

#### 🐛 Bug Fix

- SceneQueryController: Fixes double complete counting [#600](https://github.com/grafana/scenes/pull/600) ([@torkelo](https://github.com/torkelo))
- VizPanel: Fixes streaming issue [#602](https://github.com/grafana/scenes/pull/602) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.4.0 (Wed Feb 14 2024)

### Release Notes

#### VariableDependencyConfig: Support `*` to extract dependencies from every state path ([#599](https://github.com/grafana/scenes/pull/599))

**Possible breaking change: `VariableDependencyConfig` default behavior**

- **Previously:** Using `VariableDependencyConfig` without options scanned the entire state.
- **Now:** Default behavior requires an explicit wildcard (`*`) to scan the whole state. This prevents unintended dependency resolution.

**Impact:** If you intentionally scanned the entire state, use `statePaths: ['*']`. Otherwise, specify desired `statePaths` or `variableNames`.

**Example:**

```diff
class TestObj extends SceneObjectBase<TestState> {
  public constructor() {
    super({
      query: 'query with ${queryVarA} ${queryVarB}',
      otherProp: 'string with ${otherPropA}',
      nested: {
        query: 'nested object with ${nestedVarA}',
      },
    });
  }
}

it('Should be able to extract dependencies from all state', () => {
    const sceneObj = new TestObj();
-    const deps = new VariableDependencyConfig(sceneObj, {});
+    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['*'] });

    expect(deps.getNames()).toEqual(new Set(['queryVarA', 'queryVarB', 'nestedVarA', 'otherPropA']));
  });
```

This mproves performance and avoids unexpected dependency resolution.

---

#### 🚀 Enhancement

- VariableDependencyConfig: Support `*` to extract dependencies from every state path [#599](https://github.com/grafana/scenes/pull/599) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### 🐛 Bug Fix

- Fix typo in docstring [#601](https://github.com/grafana/scenes/pull/601) ([@oscarkilhed](https://github.com/oscarkilhed))
- VariableDependencyConfig can extract variables from circular structures [#597](https://github.com/grafana/scenes/pull/597) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v3.3.0 (Tue Feb 13 2024)

### Release Notes

#### Variables: Clear current value when no options are returned ([#595](https://github.com/grafana/scenes/pull/595))

All variables that extend from MultValueVariable (Query, DataSource, Custom) now clear the current value if no options / values are returned by query, clears to empty string or array depending on multi or not.

---

#### 🚀 Enhancement

- Variables: Clear current value when no options are returned [#595](https://github.com/grafana/scenes/pull/595) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.2.1 (Tue Feb 13 2024)

#### 🐛 Bug Fix

- VariableDependencyConfig: do not scan state if `variableNames` is defined [#598](https://github.com/grafana/scenes/pull/598) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v3.2.0 (Tue Feb 13 2024)

#### 🚀 Enhancement

- SceneQueryRunner: Improved way to detect changes to adhoc filters and group by variables [#596](https://github.com/grafana/scenes/pull/596) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.1.1 (Mon Feb 12 2024)

#### 🐛 Bug Fix

- AdHocFiltersVariable: Allow setting expression builder function [#582](https://github.com/grafana/scenes/pull/582) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v3.1.0 (Mon Feb 12 2024)

#### 🚀 Enhancement

- QueryController: Update global window query counter [#593](https://github.com/grafana/scenes/pull/593) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.0.0 (Mon Feb 12 2024)

### Release Notes

#### AdHocFiltersSet/Variable: Unify both objects as a scene variable (breaking change) ([#586](https://github.com/grafana/scenes/pull/586))

AdHocFilterSet is now removed from the library. AdHocFiltersVariable can now be used in both modes (auto and manual).

To migrate replace AdHocFilterSet with AdHocFiltersVariable , the `applyMode` defaults to `auto` which is the new renamed value that was previously `same-datasource`. Instead of adding this directly to a controls array add it to the variables array of a SceneVariableSet. It will then be rendered along with other variables via the VariableValueSelectors controls component. If you want to render ad hoc filters separately you can set `hide: VariableHide.hideVariable` so that the filters are not rendered by VariableValueSelectors and use the new component VariableValueControl that can render a specific variable.

`AdHocFiltersVariable.create` is also removed as this separate factory function is no longer needed. If you where using `AdHocFiltersVariable.create` then switch to the normal constructor but be sure to pass in `applyMode: 'manual'` when you create it to preserve the same behavior as before.

---

#### 💥 Breaking Change

- AdHocFiltersSet/Variable: Unify both objects as a scene variable (breaking change) [#586](https://github.com/grafana/scenes/pull/586) ([@torkelo](https://github.com/torkelo) [@ivanortegaalba](https://github.com/ivanortegaalba) [@dprokop](https://github.com/dprokop))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.7 (Sat Feb 10 2024)

#### 🐛 Bug Fix

- SceneGridLayoutRenderer: fix svg height unit [#588](https://github.com/grafana/scenes/pull/588) ([@erj826](https://github.com/erj826))

#### Authors: 1

- Eric Jacobson ([@erj826](https://github.com/erj826))

---

# v2.6.6 (Thu Feb 08 2024)

#### 🐛 Bug Fix

- GroupBy: Add variable type guard [#583](https://github.com/grafana/scenes/pull/583) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.6.5 (Thu Feb 08 2024)

#### 🐛 Bug Fix

- ResizeHandle: New style [#579](https://github.com/grafana/scenes/pull/579) ([@torkelo](https://github.com/torkelo))
- ByVariableRepeater: Repeat layout for each variable value [#573](https://github.com/grafana/scenes/pull/573) ([@torkelo](https://github.com/torkelo))
- QueryVariable: Fixes react testing act errors [#578](https://github.com/grafana/scenes/pull/578) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.4 (Wed Feb 07 2024)

#### 🐛 Bug Fix

- Scene query state & cancel all queries [#513](https://github.com/grafana/scenes/pull/513) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- QueryVariable: Sorting based on label property [#577](https://github.com/grafana/scenes/pull/577) ([@xforman2](https://github.com/xforman2))
- SceneTimeRange: Support timezone url sync [#572](https://github.com/grafana/scenes/pull/572) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- [@xforman2](https://github.com/xforman2)
- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.3 (Tue Feb 06 2024)

#### 🐛 Bug Fix

- TextBoxVariable: Fixes url sync key when name changes [#574](https://github.com/grafana/scenes/pull/574) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.2 (Tue Feb 06 2024)

#### 🐛 Bug Fix

- GroupBy variable: Fix variable type [#571](https://github.com/grafana/scenes/pull/571) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.6.1 (Tue Feb 06 2024)

#### 🐛 Bug Fix

- Variable: Fixes performance issues with variables with many select options [#569](https://github.com/grafana/scenes/pull/569) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.0 (Mon Feb 05 2024)

#### 🚀 Enhancement

- SplitLayout: Make secondary pane optional [#546](https://github.com/grafana/scenes/pull/546) ([@cbos](https://github.com/cbos) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Cees Bos ([@cbos](https://github.com/cbos))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.5.1 (Mon Feb 05 2024)

#### 🐛 Bug Fix

- SceneGridLayout: Fixes missing resize handles [#566](https://github.com/grafana/scenes/pull/566) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.5.0 (Mon Feb 05 2024)

#### 🚀 Enhancement

- Introduce GroupBy variable to allow passing group by dimensions to data sources [#548](https://github.com/grafana/scenes/pull/548) ([@ashharrison90](https://github.com/ashharrison90) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.4.0 (Thu Feb 01 2024)

#### 🚀 Enhancement

- UrlSync: Fixes overwrite issue where later state change overwrites earlier change [#555](https://github.com/grafana/scenes/pull/555) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.3.0 (Thu Feb 01 2024)

#### 🚀 Enhancement

- SceneVariableSet: Cancel query when dependency changes [#557](https://github.com/grafana/scenes/pull/557) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Fix empty state adhoc filters [#560](https://github.com/grafana/scenes/pull/560) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 2

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.2.3 (Wed Jan 31 2024)

#### 🐛 Bug Fix

- Fix dataLayer subscriptions refresh on reactivation [#554](https://github.com/grafana/scenes/pull/554) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v2.2.2 (Wed Jan 31 2024)

#### 🐛 Bug Fix

- AdHocFiltersVariable: The `create()` factory supports `applyMode` as parameter [#553](https://github.com/grafana/scenes/pull/553) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v2.2.1 (Tue Jan 30 2024)

#### 🐛 Bug Fix

- AdHocFiltersVariable: AdHocFilterSet is not activated when the parent variable is mounted [#550](https://github.com/grafana/scenes/pull/550) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v2.2.0 (Tue Jan 30 2024)

#### 🚀 Enhancement

- AdHocFiltersSet: Pass scene queries to getTagKeys calls [#544](https://github.com/grafana/scenes/pull/544) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.1.0 (Fri Jan 26 2024)

#### 🚀 Enhancement

- Fixes issue with exemplar link [#540](https://github.com/grafana/scenes/pull/540) ([@cbos](https://github.com/cbos))
- SceneDataTransformer: Fixes issue with getResultStream not emitting values when there are no transformations [#543](https://github.com/grafana/scenes/pull/543) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- LocalValueVariable: Provide backwards compatibility for SQL-ish data source [#549](https://github.com/grafana/scenes/pull/549) ([@dprokop](https://github.com/dprokop))

#### Authors: 3

- Cees Bos ([@cbos](https://github.com/cbos))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.0.0 (Mon Jan 22 2024)

### Release Notes

#### Variables: Notify scene after each variable completion or value change ([#525](https://github.com/grafana/scenes/pull/525))

`VariableDependencyConfigLike` interface has changed so that scene objects now get notified after each variable update is completed (or changed value). Before, the `SceneVariableSet` waited for all variables to complete before notifying scene objects.

The function `variableUpdatesCompleted` has changed name and signature:

```ts
variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void;
```

`VariableDependencyConfig` has also some breaking changes. The function named `onVariableUpdatesCompleted` has changed name and signature to:

```ts
 onVariableUpdateCompleted?: () => void;
```

`VariableDependencyConfig` now handles the state logic for "waitingForVariables". If you call `VariableDependencyConfig.hasDependencyInLoadingState` and it returns true it will remember this waiting state and call `onVariableUpdateCompleted` as soon as the next variable update is completed, no matter if that variable is a dependency or if it changed or not.

---

#### 💥 Breaking Change

- Variables: Notify scene after each variable completion or value change [#525](https://github.com/grafana/scenes/pull/525) ([@torkelo](https://github.com/torkelo))

#### 🚀 Enhancement

- UrlSync: Export new util functions [#529](https://github.com/grafana/scenes/pull/529) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.30.0 (Thu Jan 18 2024)

#### 🚀 Enhancement

- SceneGridLayout: Support new visualization tooltips [#530](https://github.com/grafana/scenes/pull/530) ([@torkelo](https://github.com/torkelo))
- Adhoc filters variable improvements [#518](https://github.com/grafana/scenes/pull/518) ([@javiruiz01](https://github.com/javiruiz01))

#### 🐛 Bug Fix

- Revert "Chore: Update peer dependencies" [#533](https://github.com/grafana/scenes/pull/533) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 3

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.29.0 (Tue Jan 16 2024)

#### 🚀 Enhancement

- SplitLayout: Allow pane style overrides to be passed through [#531](https://github.com/grafana/scenes/pull/531) ([@kaydelaney](https://github.com/kaydelaney))

#### 🐛 Bug Fix

- Variables: Checking if a dependency is loading should also check that dependency dependencies [#523](https://github.com/grafana/scenes/pull/523) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.6 (Sat Jan 06 2024)

#### 🐛 Bug Fix

- SceneTimeRange: Support delay now to avoid data drops in charts [#509](https://github.com/grafana/scenes/pull/509) ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Fix issue with duplicate annotations [#515](https://github.com/grafana/scenes/pull/515) ([@domasx2](https://github.com/domasx2))
- SceneQueryRunner: Fix redundant execution on variable change [#519](https://github.com/grafana/scenes/pull/519) ([@domasx2](https://github.com/domasx2))
- Splitter: Fixes small issue with keyboard control [#498](https://github.com/grafana/scenes/pull/498) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 3

- Domas ([@domasx2](https://github.com/domasx2))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v1.28.5 (Wed Dec 20 2023)

#### 🐛 Bug Fix

- CSSGridLayout: Remove semi colon [#511](https://github.com/grafana/scenes/pull/511) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v1.28.4 (Wed Dec 20 2023)

#### 🐛 Bug Fix

- CSSGridLayout: Lazy loading [#510](https://github.com/grafana/scenes/pull/510) ([@adrapereira](https://github.com/adrapereira) [@torkelo](https://github.com/torkelo))

#### Authors: 2

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.3 (Tue Dec 19 2023)

#### 🐛 Bug Fix

- IntervalVariable: Makes it return the original variable expression when data or request is not present [#508](https://github.com/grafana/scenes/pull/508) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.2 (Tue Dec 19 2023)

#### 🐛 Bug Fix

- SceneQueryRunner: Improve the way to find adhoc filter set [#506](https://github.com/grafana/scenes/pull/506) ([@torkelo](https://github.com/torkelo))
- CustomVariable: Interpolate query [#502](https://github.com/grafana/scenes/pull/502) ([@torkelo](https://github.com/torkelo))
- VizPanel Re-render skipDataQuery panels when time range change [#492](https://github.com/grafana/scenes/pull/492) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.1 (Wed Dec 13 2023)

#### 🐛 Bug Fix

- Variables: Fixes issue with chained variable and cascading updates [#501](https://github.com/grafana/scenes/pull/501) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.0 (Thu Dec 07 2023)

#### 🚀 Enhancement

- SplitLayout: Allow setting initial size [#496](https://github.com/grafana/scenes/pull/496) ([@cedricziel](https://github.com/cedricziel) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Cedric Ziel ([@cedricziel](https://github.com/cedricziel))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.27.0 (Tue Dec 05 2023)

#### 🚀 Enhancement

- VizPanel: Expose events for interactions [#491](https://github.com/grafana/scenes/pull/491) ([@dprokop](https://github.com/dprokop))

#### 🐛 Bug Fix

- QueryVariable: Run query with scene time range on when configured to run on load [#490](https://github.com/grafana/scenes/pull/490) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.26.0 (Mon Dec 04 2023)

#### 🚀 Enhancement

- Variables: Query - Add optional `definition` prop to state [#489](https://github.com/grafana/scenes/pull/489) ([@axelavargas](https://github.com/axelavargas))

#### 🐛 Bug Fix

- Simplify interval macro [#488](https://github.com/grafana/scenes/pull/488) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Alexa V ([@axelavargas](https://github.com/axelavargas))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.25.0 (Fri Dec 01 2023)

#### 🚀 Enhancement

- Macros: Support $\_interval[_ms] variable [#487](https://github.com/grafana/scenes/pull/487) ([@dprokop](https://github.com/dprokop))

#### 🐛 Bug Fix

- VizPanelMenu: Fix auto focus / keyboard navigation issue [#483](https://github.com/grafana/scenes/pull/483) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.6 (Mon Nov 27 2023)

#### 🐛 Bug Fix

- SceneQueryRunner: Fixes issue with cloned scene query runner would issue new query [#482](https://github.com/grafana/scenes/pull/482) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.5 (Fri Nov 24 2023)

#### 🐛 Bug Fix

- SceneQueryRunner: Fixes issue with waiting for variables [#481](https://github.com/grafana/scenes/pull/481) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.4 (Fri Nov 24 2023)

#### 🐛 Bug Fix

- VizPanelRenderer: Round visualization width pushed to data provider [#478](https://github.com/grafana/scenes/pull/478) ([@dprokop](https://github.com/dprokop))

#### ⚠️ Pushed to `main`

- Revert "VizPanelRenderer: Round viz width pushed to data provider" ([@dprokop](https://github.com/dprokop))
- VizPanelRenderer: Round viz width pushed to data provider ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.3 (Thu Nov 23 2023)

#### 🐛 Bug Fix

- VizPanel: Only pass data layers to panel when plugin supports them [#477](https://github.com/grafana/scenes/pull/477) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.2 (Wed Nov 22 2023)

#### 🐛 Bug Fix

- Variables: Clear error state [#476](https://github.com/grafana/scenes/pull/476) ([@torkelo](https://github.com/torkelo))
- Variables: Fixes validation issue where the current saved value only matches text representation [#475](https://github.com/grafana/scenes/pull/475) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.1 (Tue Nov 21 2023)

#### 🐛 Bug Fix

- Fix non-null assertion in SceneQueryRunner [#474](https://github.com/grafana/scenes/pull/474) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.0 (Tue Nov 21 2023)

#### 🚀 Enhancement

- Variables: Add type guards for variables [#472](https://github.com/grafana/scenes/pull/472) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 1

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v1.23.1 (Fri Nov 17 2023)

#### 🐛 Bug Fix

- fix: compare time ranges using actual unix time vs objects [#468](https://github.com/grafana/scenes/pull/468) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 1

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))

---

# v1.23.0 (Fri Nov 17 2023)

#### 🚀 Enhancement

- Variables: Add natural sort from core grafana to query variables [#459](https://github.com/grafana/scenes/pull/459) ([@axelavargas](https://github.com/axelavargas))

#### 🐛 Bug Fix

- Adhoc filters: Add tagKeyRegexFilter prop [#469](https://github.com/grafana/scenes/pull/469) ([@anaivanov](https://github.com/anaivanov))
- VizPanel: Don't show popup when description is empty [#465](https://github.com/grafana/scenes/pull/465) ([@dprokop](https://github.com/dprokop))
- VIzPanel: Support markdown in panel description [#464](https://github.com/grafana/scenes/pull/464) ([@dprokop](https://github.com/dprokop))
- Variables: No wrapping selects [#461](https://github.com/grafana/scenes/pull/461) ([@torkelo](https://github.com/torkelo))

#### Authors: 4

- Alexa V ([@axelavargas](https://github.com/axelavargas))
- Ana Ivanov ([@anaivanov](https://github.com/anaivanov))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.22.1 (Tue Nov 14 2023)

#### 🐛 Bug Fix

- Variables: Fixes url sync issue for key/value multi value variables [#455](https://github.com/grafana/scenes/pull/455) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.22.0 (Mon Nov 13 2023)

#### 🚀 Enhancement

- SceneQueryRunner: Handle alert states data layer [#454](https://github.com/grafana/scenes/pull/454) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Urls: Make sure urls include sub path [#434](https://github.com/grafana/scenes/pull/434) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.21.1 (Thu Nov 09 2023)

#### 🐛 Bug Fix

- Variables: Register variable macro [#452](https://github.com/grafana/scenes/pull/452) ([@torkelo](https://github.com/torkelo))
- Variables: Support for variables on lower levels to depend on variables on higher levels [#443](https://github.com/grafana/scenes/pull/443) ([@torkelo](https://github.com/torkelo))
- VizPanel: Handle empty arrays when merging new panel options [#447](https://github.com/grafana/scenes/pull/447) ([@javiruiz01](https://github.com/javiruiz01))
- PanelContext: Eventbus should not filter out local events [#445](https://github.com/grafana/scenes/pull/445) ([@torkelo](https://github.com/torkelo))
- Variables: Support **org and **user variable macros [#449](https://github.com/grafana/scenes/pull/449) ([@torkelo](https://github.com/torkelo))
- SceneQueryRunner: Fixes adhoc filters when using a variable data source [#422](https://github.com/grafana/scenes/pull/422) ([@torkelo](https://github.com/torkelo))
- VizPanel: Support passing legacyPanelId to PanelProps [#446](https://github.com/grafana/scenes/pull/446) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.21.0 (Mon Nov 06 2023)

#### 🚀 Enhancement

- Variables: Multi select batch update [#410](https://github.com/grafana/scenes/pull/410) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- VizPanel: Fixes series visibility toggling [#444](https://github.com/grafana/scenes/pull/444) ([@torkelo](https://github.com/torkelo))
- Vertical layout for variable selectors and a simple mode for adhoc filters [#427](https://github.com/grafana/scenes/pull/427) ([@torkelo](https://github.com/torkelo))
- feat: support gridRow and gridColumn for SceneCSSGridItem [#440](https://github.com/grafana/scenes/pull/440) ([@erj826](https://github.com/erj826))
- Remove checkbox from time window comparison [#415](https://github.com/grafana/scenes/pull/415) ([@javiruiz01](https://github.com/javiruiz01) [@torkelo](https://github.com/torkelo))

#### Authors: 3

- Eric Jacobson ([@erj826](https://github.com/erj826))
- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.20.1 (Mon Oct 30 2023)

#### 🐛 Bug Fix

- VizPanel: Allow title items configuration [#437](https://github.com/grafana/scenes/pull/437) ([@dprokop](https://github.com/dprokop))
- SceneByFrameRepeater: Fixes issue with not processing repeats on activation when there is data [#436](https://github.com/grafana/scenes/pull/436) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.20.0 (Thu Oct 26 2023)

### Release Notes

#### DataSourceVariable: Value should be uid, and other fixes ([#400](https://github.com/grafana/scenes/pull/400))

DataSourceVariable value is now the uid of the data source not the name. Please test and verify that your data source variables works like before.

---

#### 🚀 Enhancement

- Variables: Fixes SQL formatting and escaping double quotes [#433](https://github.com/grafana/scenes/pull/433) ([@piggito](https://github.com/piggito) [@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneGraph: Add utility function getAncestor [#428](https://github.com/grafana/scenes/pull/428) ([@torkelo](https://github.com/torkelo))
- VizPanel: Make VizPanel usable without relative position parent [#430](https://github.com/grafana/scenes/pull/430) ([@torkelo](https://github.com/torkelo))
- SceneCSSGridLayout: Make rowGap and columnGap use grid units [#431](https://github.com/grafana/scenes/pull/431) ([@torkelo](https://github.com/torkelo))
- Export VizPanelBuilder [#429](https://github.com/grafana/scenes/pull/429) ([@torkelo](https://github.com/torkelo))
- DataSourceVariable: Value should be uid, and other fixes [#400](https://github.com/grafana/scenes/pull/400) ([@torkelo](https://github.com/torkelo))
- [cr] creates SceneCSSGridLayout to use CSS Grid with SceneFlexItems [#392](https://github.com/grafana/scenes/pull/392) ([@jewbetcha](https://github.com/jewbetcha) [@torkelo](https://github.com/torkelo))

#### Authors: 3

- Coleman Rollins ([@jewbetcha](https://github.com/jewbetcha))
- Juan Luis Peña Wagner ([@piggito](https://github.com/piggito))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.19.1 (Fri Oct 20 2023)

#### 🐛 Bug Fix

- SceneTimeRange: Respect time zone when updating time range [#420](https://github.com/grafana/scenes/pull/420) ([@dprokop](https://github.com/dprokop))
- UrlSync: Fixes and one update [#419](https://github.com/grafana/scenes/pull/419) ([@torkelo](https://github.com/torkelo))
- AdhocFilterVariable: Render expr (value) in constructor [#417](https://github.com/grafana/scenes/pull/417) ([@torkelo](https://github.com/torkelo))
- Revert "SceneTimeRange: Respect time zone when updating time range" [#418](https://github.com/grafana/scenes/pull/418) ([@torkelo](https://github.com/torkelo))
- AdHocFiltersVariable: Fixes issue with unnessary change events [#414](https://github.com/grafana/scenes/pull/414) ([@torkelo](https://github.com/torkelo))
- SceneTimeRange: Respect time zone when updating time range [#413](https://github.com/grafana/scenes/pull/413) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.19.0 (Mon Oct 16 2023)

#### 🚀 Enhancement

- AdHocVariable: Fixes trailing comma [#411](https://github.com/grafana/scenes/pull/411) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.18.0 (Thu Oct 12 2023)

#### 🚀 Enhancement

- VizPanel: Adds extendPanelContext so that consumers can control some of the PanelContext functions [#409](https://github.com/grafana/scenes/pull/409) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.17.0 (Wed Oct 11 2023)

#### 🚀 Enhancement

- SceneTimePicker: Add posibility to navigate backwards/forwards an absolute time range [#408](https://github.com/grafana/scenes/pull/408) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v1.16.0 (Wed Oct 11 2023)

#### 🚀 Enhancement

- SceneVariableSet: isVariableLoadingOrWaitingToUpdate should ignore isActive state [#405](https://github.com/grafana/scenes/pull/405) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.15.1 (Wed Oct 11 2023)

#### 🐛 Bug Fix

- Scenes: Interval Variable now considers $\_\_auto_interval [#407](https://github.com/grafana/scenes/pull/407) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v1.15.0 (Tue Oct 10 2023)

#### 🚀 Enhancement

- Markup: element data keys changes [#403](https://github.com/grafana/scenes/pull/403) ([@torkelo](https://github.com/torkelo))
- QueryVariable: Fix sort default value [#398](https://github.com/grafana/scenes/pull/398) ([@torkelo](https://github.com/torkelo))
- QueryVariable: Support for queries that contain "$\_\_searchFilter" [#395](https://github.com/grafana/scenes/pull/395) ([@torkelo](https://github.com/torkelo))
- TextBoxVariable: Fixes and make it auto size [#394](https://github.com/grafana/scenes/pull/394) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- VizPanel: Add support for a custom migration handler [#396](https://github.com/grafana/scenes/pull/396) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Fix enrichDataRequest call for drilldown pages [#402](https://github.com/grafana/scenes/pull/402) ([@torkelo](https://github.com/torkelo))
- ActWhenVariableChanged: Add behavior to onChange callback [#393](https://github.com/grafana/scenes/pull/393) ([@torkelo](https://github.com/torkelo))
- Variables: Updates the demo scene [#388](https://github.com/grafana/scenes/pull/388) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.14.0 (Wed Oct 04 2023)

#### 🚀 Enhancement

- Variables: Fix issue with all value state and no options [#391](https://github.com/grafana/scenes/pull/391) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.13.0 (Wed Oct 04 2023)

#### 🚀 Enhancement

- Compatability: Add global window object that points to the current active EmbeddedScene [#390](https://github.com/grafana/scenes/pull/390) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.12.0 (Tue Oct 03 2023)

#### 🚀 Enhancement

- AdhocFilters: Pass filters via request object [#382](https://github.com/grafana/scenes/pull/382) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneTimeRange: Implement onZoom behavior [#374](https://github.com/grafana/scenes/pull/374) ([@polibb](https://github.com/polibb))

#### Authors: 2

- Polina Boneva ([@polibb](https://github.com/polibb))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.11.1 (Tue Oct 03 2023)

#### 🐛 Bug Fix

- SceneAppPageView: Fixes react and scene state missmatch [#381](https://github.com/grafana/scenes/pull/381) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.11.0 (Tue Oct 03 2023)

#### 🚀 Enhancement

- TimePicker: Show and update fiscal year month [#386](https://github.com/grafana/scenes/pull/386) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.10.0 (Mon Oct 02 2023)

#### 🚀 Enhancement

- Variables: Implement Interval Variable [#365](https://github.com/grafana/scenes/pull/365) ([@axelavargas](https://github.com/axelavargas))
- Variables: Support skipUrlSync option [#376](https://github.com/grafana/scenes/pull/376) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneFlexLayout: Export SceneFlexItemLike [#385](https://github.com/grafana/scenes/pull/385) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Custom fallback page [#380](https://github.com/grafana/scenes/pull/380) ([@domasx2](https://github.com/domasx2))

#### Authors: 3

- Alexa V ([@axelavargas](https://github.com/axelavargas))
- Domas ([@domasx2](https://github.com/domasx2))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.9.0 (Fri Sep 29 2023)

#### 🚀 Enhancement

- SceneVariableSet: Show and log errors [#371](https://github.com/grafana/scenes/pull/371) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneTimeRange: Add weekStart support and make sure fiscalYearMonth is used everywhere [#375](https://github.com/grafana/scenes/pull/375) ([@torkelo](https://github.com/torkelo))
- EmbeddedScene: Patch TimeSrv [#379](https://github.com/grafana/scenes/pull/379) ([@dprokop](https://github.com/dprokop))
- AdHocFiltersSet and AdhocFiltersVariable with manual and automatic modes [#346](https://github.com/grafana/scenes/pull/346) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.8.0 (Mon Sep 25 2023)

#### 🚀 Enhancement

- VizPanel: Allow options and field config updates [#363](https://github.com/grafana/scenes/pull/363) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.7.1 (Mon Sep 25 2023)

#### 🐛 Bug Fix

- AnnotationsDataLayer: Support query request enriching [#364](https://github.com/grafana/scenes/pull/364) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.7.0 (Mon Sep 25 2023)

#### 🚀 Enhancement

- SceneTimeRangeCompare: Enable URL sync [#360](https://github.com/grafana/scenes/pull/360) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.6.0 (Fri Sep 22 2023)

#### 🚀 Enhancement

- AnnotationsDataLayer: Add variables support [#358](https://github.com/grafana/scenes/pull/358) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.3 (Fri Sep 22 2023)

#### 🐛 Bug Fix

- SceneApp: Introduce a useSceneApp hook that should replace useMemo as method of caching SceneApp instance [#357](https://github.com/grafana/scenes/pull/357) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.5.2 (Thu Sep 21 2023)

#### 🐛 Bug Fix

- SceneDataTransformer: Handle transformation errors [#354](https://github.com/grafana/scenes/pull/354) ([@dprokop](https://github.com/dprokop))
- AnnotationsDataLayer: Events deduplication [#351](https://github.com/grafana/scenes/pull/351) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.1 (Wed Sep 20 2023)

#### 🐛 Bug Fix

- AnnotationsDataLayer: Provide inheritance extension points [#347](https://github.com/grafana/scenes/pull/347) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.0 (Wed Sep 20 2023)

#### 🚀 Enhancement

- Variables: Fix issue with previous fix [#350](https://github.com/grafana/scenes/pull/350) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.4.0 (Wed Sep 20 2023)

#### 🚀 Enhancement

- Variables: Fixes issue with running variable queries with custom or legacy runner [#348](https://github.com/grafana/scenes/pull/348) ([@torkelo](https://github.com/torkelo))
- QueryVariable: Fixes queries with older model [#340](https://github.com/grafana/scenes/pull/340) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.3.3 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- SceneAppPage: Fix infinite recurision of enrichDataRequest [#345](https://github.com/grafana/scenes/pull/345) ([@torkelo](https://github.com/torkelo))
- Data layer controls: Allow hiding [#344](https://github.com/grafana/scenes/pull/344) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.3.2 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- Annotations filtering operator: Correctly populate filtered frames [#343](https://github.com/grafana/scenes/pull/343) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.3.1 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- AnnotationsDataLayer: Handle data source error [#342](https://github.com/grafana/scenes/pull/342) ([@dprokop](https://github.com/dprokop))
- DataLayers: Allow cancelling layers from layer control [#337](https://github.com/grafana/scenes/pull/337) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.3.0 (Mon Sep 18 2023)

#### 🚀 Enhancement

- NestedScene: Update design to match grid row, add controls property and update demo scene to include variables [#335](https://github.com/grafana/scenes/pull/335) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- VizPanel: Support async migration handlers [#341](https://github.com/grafana/scenes/pull/341) ([@torkelo](https://github.com/torkelo))
- DataLayers: Allow toggling individual layers on/off [#333](https://github.com/grafana/scenes/pull/333) ([@dprokop](https://github.com/dprokop))
- Data layers: Annotations [#328](https://github.com/grafana/scenes/pull/328) ([@dprokop](https://github.com/dprokop))
- Data layers: Isolated change [#325](https://github.com/grafana/scenes/pull/325) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.2.0 (Wed Sep 13 2023)

#### 🚀 Enhancement

- SceneObject: Add getRef for easier SceneObjectRef usage [#330](https://github.com/grafana/scenes/pull/330) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneControlsSpacer: Fix flickering [#332](https://github.com/grafana/scenes/pull/332) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.1.1 (Sat Sep 09 2023)

#### 🐛 Bug Fix

- SceneGridLayout: Fix toggle row issue [#326](https://github.com/grafana/scenes/pull/326) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.0.0 (Wed Sep 06 2023)

#### 💥 Breaking Change

- Scenes 1.0 release prep [#323](https://github.com/grafana/scenes/pull/323) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.29.2 (Wed Sep 06 2023)

#### 🐛 Bug Fix

- SceneObject: Support changing $data, $timeRange and $variables during the active phase [#324](https://github.com/grafana/scenes/pull/324) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.29.1 (Tue Sep 05 2023)

#### 🐛 Bug Fix

- SceneGridRow: Small design change and fixes, add actions support [#321](https://github.com/grafana/scenes/pull/321) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.29.0 (Tue Sep 05 2023)

#### 🚀 Enhancement

- TestVariable: Add optionsToReturn and other unrelated changes [#314](https://github.com/grafana/scenes/pull/314) ([@torkelo](https://github.com/torkelo))
- Variables: New LocalValueVariable to better support repeating panels [#317](https://github.com/grafana/scenes/pull/317) ([@torkelo](https://github.com/torkelo))
- VizPanel: Remove left-over isDraggable/isResizable state [#315](https://github.com/grafana/scenes/pull/315) ([@torkelo](https://github.com/torkelo))
- QueryVariable: Support null ds [#316](https://github.com/grafana/scenes/pull/316) ([@torkelo](https://github.com/torkelo))
- SceneTimeRangeTransformerBase [#312](https://github.com/grafana/scenes/pull/312) ([@torkelo](https://github.com/torkelo))
- VizPanel: Allow panels to rendered without layout parent [#302](https://github.com/grafana/scenes/pull/302) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- MultiValueVariable: Fix url sync for isMulti when default value is not an array [#318](https://github.com/grafana/scenes/pull/318) ([@torkelo](https://github.com/torkelo))
- DataQueryRequest enricher [#311](https://github.com/grafana/scenes/pull/311) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.28.1 (Thu Aug 31 2023)

#### 🐛 Bug Fix

- SceneGridLayout: Remove z-index [#308](https://github.com/grafana/scenes/pull/308) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.28.0 (Thu Aug 31 2023)

#### 🚀 Enhancement

- SceneObjectRef: Provide a way to have references to other scene objects without impacting parent [#304](https://github.com/grafana/scenes/pull/304) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

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
    new SceneTimeRangeCompare({}), // Use this object to enable time frame comparison UI
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

- Allow time range comparison [#244](https://github.com/grafana/scenes/pull/244) ([@dprokop](https://github.com/dprokop) [@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.26.0 (Tue Aug 29 2023)

#### 🚀 Enhancement

- sceneUtils: cloneSceneObjectState [#297](https://github.com/grafana/scenes/pull/297) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.25.0 (Tue Aug 22 2023)

#### 🚀 Enhancement

- SceneQueryRunner: Fixes issues when being cloned [#288](https://github.com/grafana/scenes/pull/288) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Allow template variables to be cancelled [#261](https://github.com/grafana/scenes/pull/261) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.24.2 (Mon Aug 21 2023)

#### 🐛 Bug Fix

- SceneTimeRange: Don't update state if time range has not changed [#291](https://github.com/grafana/scenes/pull/291) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.24.1 (Fri Aug 18 2023)

#### 🐛 Bug Fix

- SceneObject: Warn if parent is already set to another SceneObject [#284](https://github.com/grafana/scenes/pull/284) ([@torkelo](https://github.com/torkelo))
- VizPanel: Handle plugin not found scenario correctly [#287](https://github.com/grafana/scenes/pull/287) ([@dprokop](https://github.com/dprokop))
- VariableValueSelectors: Don't wrap labels [#285](https://github.com/grafana/scenes/pull/285) ([@dprokop](https://github.com/dprokop))
- SceneDebugger: Scene graph explore & state viewer [#262](https://github.com/grafana/scenes/pull/262) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.24.0 (Fri Aug 04 2023)

#### 🚀 Enhancement

- Tabs: Add icon and suffix [#248](https://github.com/grafana/scenes/pull/248) ([@pbaumard](https://github.com/pbaumard))

#### 🐛 Bug Fix

- PanelBuilders: Fix default options being mutated [#274](https://github.com/grafana/scenes/pull/274) ([@dprokop](https://github.com/dprokop))

#### 🔩 Dependency Updates

- Bump grafana dependencies [#273](https://github.com/grafana/scenes/pull/273) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Pierre Baumard ([@pbaumard](https://github.com/pbaumard))

---

# v0.23.0 (Wed Jul 19 2023)

#### 🚀 Enhancement

- Behaviors: Provide behavior for visualization cursor sync [#259](https://github.com/grafana/scenes/pull/259) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.22.0 (Wed Jul 19 2023)

#### 🚀 Enhancement

- Mark grafana dependencies as peerDependencies [#268](https://github.com/grafana/scenes/pull/268) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.21.0 (Tue Jul 18 2023)

#### 🚀 Enhancement

- FieldConfigOverridesBuilder: Simplify matchFieldsByValue API [#267](https://github.com/grafana/scenes/pull/267) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.20.1 (Thu Jul 13 2023)

#### 🐛 Bug Fix

- PanelBuilders: Fix regex matcher for overrides [#264](https://github.com/grafana/scenes/pull/264) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.20.0 (Tue Jul 11 2023)

#### 🚀 Enhancement

- Behaviors: Enabled type stateless behavior params [#254](https://github.com/grafana/scenes/pull/254) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.19.0 (Tue Jul 11 2023)

#### 🚀 Enhancement

- SceneQueryRunner: Provide rangeRaw in request [#253](https://github.com/grafana/scenes/pull/253) ([@dprokop](https://github.com/dprokop))
- SceneGridItem: Makes isDraggable and isResizable optional [#251](https://github.com/grafana/scenes/pull/251) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- GridLayout: Default isDraggable to false (unset) [#246](https://github.com/grafana/scenes/pull/246) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.18.0 (Wed Jul 05 2023)

#### 🚀 Enhancement

- SceneGridLayout: Fixes draggable attribute [#245](https://github.com/grafana/scenes/pull/245) ([@torkelo](https://github.com/torkelo))
- SceneGridLayout: Fixes issues with unmount on every re-render [#243](https://github.com/grafana/scenes/pull/243) ([@torkelo](https://github.com/torkelo))
- Querying: Support runtime registered data source [#159](https://github.com/grafana/scenes/pull/159) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneGridRow: Fix rows auto collapsing on load due to url sync [#241](https://github.com/grafana/scenes/pull/241) ([@torkelo](https://github.com/torkelo))
- SceneQueryRunner: Support `liveStreaming` [#239](https://github.com/grafana/scenes/pull/239) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.17.2 (Tue Jun 27 2023)

#### 🐛 Bug Fix

- SceneQueryRunner: Cancel previous request when starting new one [#238](https://github.com/grafana/scenes/pull/238) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.17.1 (Wed Jun 21 2023)

#### 🐛 Bug Fix

- PanelBuilders: Add method for setting behaviors [#235](https://github.com/grafana/scenes/pull/235) ([@dprokop](https://github.com/dprokop))
- SplitLayout: Add Splitter and SplitLayout [#229](https://github.com/grafana/scenes/pull/229) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.17.0 (Mon Jun 19 2023)

#### 🚀 Enhancement

- VizPanel: Allow queries to be cancelled [#220](https://github.com/grafana/scenes/pull/220) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v0.16.0 (Mon Jun 19 2023)

#### 🚀 Enhancement

- PanelBuilders: Typed API for VizPanel creation [#225](https://github.com/grafana/scenes/pull/225) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.15.0 (Fri Jun 09 2023)

#### 🚀 Enhancement

- SceneAppPage: Fix page with tabs and drilldown on main page level [#228](https://github.com/grafana/scenes/pull/228) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.14.0 (Thu Jun 01 2023)

#### 🚀 Enhancement

- SceneQueryRunner: Only use containerWidth when maxDataPointsFromWidth is true [#223](https://github.com/grafana/scenes/pull/223) ([@torkelo](https://github.com/torkelo))
- SceneQueryRunner: Re-run queries onActivate when time range changed [#221](https://github.com/grafana/scenes/pull/221) ([@torkelo](https://github.com/torkelo))
- TimeRangePicker: Default to the "isOnCanvas" true look [#222](https://github.com/grafana/scenes/pull/222) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.13.0 (Tue May 30 2023)

#### 🚀 Enhancement

- Behaviors: Variable changed [#219](https://github.com/grafana/scenes/pull/219) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.12.1 (Fri May 26 2023)

#### 🐛 Bug Fix

- QueryVariable: Correct picker for multi-value variable [#218](https://github.com/grafana/scenes/pull/218) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.12.0 (Thu May 25 2023)

#### 🚀 Enhancement

- SceneAppPage: Support react elements in subtitle [#196](https://github.com/grafana/scenes/pull/196) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.11.0 (Tue May 23 2023)

#### 🚀 Enhancement

- Macros: Url macro [#199](https://github.com/grafana/scenes/pull/199) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- Macros: Add \_\_timezone macro [#200](https://github.com/grafana/scenes/pull/200) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.10.0 (Tue May 23 2023)

#### 🚀 Enhancement

- Macros: Add from and to macro [#197](https://github.com/grafana/scenes/pull/197) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.9.0 (Mon May 22 2023)

#### 🚀 Enhancement

- Scene utils: Expose helper for building drilldown links [#193](https://github.com/grafana/scenes/pull/193) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.8.1 (Thu May 18 2023)

#### 🐛 Bug Fix

- SceneDataTransformer: Correctly resolve isDataReadyToDisplay [#194](https://github.com/grafana/scenes/pull/194) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.8.0 (Thu May 18 2023)

#### 🚀 Enhancement

- SceneQueryRunner: Initial data state to avoid unnecesary No data messages [#190](https://github.com/grafana/scenes/pull/190) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.7.1 (Wed May 17 2023)

#### 🐛 Bug Fix

- SceneReactObject: Fix type issue [#191](https://github.com/grafana/scenes/pull/191) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Fixes issue with duplicate breadcrumbs [#175](https://github.com/grafana/scenes/pull/175) ([@torkelo](https://github.com/torkelo))

#### 📝 Documentation

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

- VizPanel: Support adding header actions to top right corner of PanelChrome [#174](https://github.com/grafana/scenes/pull/174) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Add support for custom title [#171](https://github.com/grafana/scenes/pull/171) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Add support for timezones [#167](https://github.com/grafana/scenes/pull/167) ([@dprokop](https://github.com/dprokop))
- FlexLayout: Responsive breakpoints [#156](https://github.com/grafana/scenes/pull/156) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.6.0 (Fri Apr 21 2023)

#### 🚀 Enhancement

- SceneObjectBase: Fixes issue with useState subscription misses state change that happens between frist render and useEffect [#161](https://github.com/grafana/scenes/pull/161) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.5.0 (Thu Apr 20 2023)

#### 🚀 Enhancement

- FormatRegistry: New format added [#155](https://github.com/grafana/scenes/pull/155) ([@juanicabanas](https://github.com/juanicabanas) [@dprokop](https://github.com/dprokop))
- VizPanel: Support noPadding panel plugins [#158](https://github.com/grafana/scenes/pull/158) ([@torkelo](https://github.com/torkelo))
- VizPanel: Support runtime registered panel plugins [#154](https://github.com/grafana/scenes/pull/154) ([@torkelo](https://github.com/torkelo))

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

- Behaviors: Add state and runtime behavior to any scene object [#119](https://github.com/grafana/scenes/pull/119) ([@torkelo](https://github.com/torkelo))
- SceneObjectBase: Activate parents before children [#148](https://github.com/grafana/scenes/pull/148) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- SceneQueryRunner: Return after setting empty state [#145](https://github.com/grafana/scenes/pull/145) ([@torkelo](https://github.com/torkelo))
- SceneGridLayout: Support lazy rendering of items out of view [#129](https://github.com/grafana/scenes/pull/129) ([@kaydelaney](https://github.com/kaydelaney) [@torkelo](https://github.com/torkelo))
- UrlSync: Makes url sync work on SceneAppPage level [#143](https://github.com/grafana/scenes/pull/143) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Refactorings and adding default fallback routes [#142](https://github.com/grafana/scenes/pull/142) ([@torkelo](https://github.com/torkelo))
- Flex layout item parent direction [#141](https://github.com/grafana/scenes/pull/141) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))
- SceneApp: Correctly build demo pages with getParentPage [#137](https://github.com/grafana/scenes/pull/137) ([@torkelo](https://github.com/torkelo))
- Templating: Add macros for **data, **field and \_\_series [#131](https://github.com/grafana/scenes/pull/131) ([@torkelo](https://github.com/torkelo))
- FlexLayout: Allow SceneFlexLayout to be child of another flex layout [#135](https://github.com/grafana/scenes/pull/135) ([@dprokop](https://github.com/dprokop))
- FindObject: Fixes search logic so that it does not get stuck in infine loops [#140](https://github.com/grafana/scenes/pull/140) ([@torkelo](https://github.com/torkelo))
- sceneGraph: findObject [#127](https://github.com/grafana/scenes/pull/127) ([@torkelo](https://github.com/torkelo))
- SceneAppPage: Support dynamic pages (changing tabs, title, controls) [#71](https://github.com/grafana/scenes/pull/71) ([@torkelo](https://github.com/torkelo))
- scene-app: Refactor to use SceneAppPage for demos [#125](https://github.com/grafana/scenes/pull/125) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- Packages: Update grafana/\* to latest [#130](https://github.com/grafana/scenes/pull/130) ([@torkelo](https://github.com/torkelo))
- QueryEditor: Adds inline query editor scene object [#43](https://github.com/grafana/scenes/pull/43) ([@kaydelaney](https://github.com/kaydelaney) [@dprokop](https://github.com/dprokop))
- SceneVariableSet: Refresh variables that depend on time range [#124](https://github.com/grafana/scenes/pull/124) ([@dprokop](https://github.com/dprokop))
- ValueMacro: Fixes so \_\_value works for rowIndex 0 [#123](https://github.com/grafana/scenes/pull/123) ([@torkelo](https://github.com/torkelo))

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
