# v4.26.3 (Thu Jun 06 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VariableValueSelect: Adjust data-testid in OptionWithCheckbox [#770](https://github.com/grafana/scenes/pull/770) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.26.2 (Thu Jun 06 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Variables: Support variable expressions inside custom values [#774](https://github.com/grafana/scenes/pull/774) ([@torkelo](https://github.com/torkelo))
  - SceneQueryRunner: Act as if we're loading when waiting for variables to load. [#768](https://github.com/grafana/scenes/pull/768) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.26.1 (Wed Jun 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes-react`, `@grafana/scenes`
  - PlainReact: Expose scene features through contexts and hooks and normal react components [#734](https://github.com/grafana/scenes/pull/734) ([@torkelo](https://github.com/torkelo) [@oscarkilhed](https://github.com/oscarkilhed))
- `@grafana/scenes`
  - SceneQueryRunner: decouple time range comparisons [#587](https://github.com/grafana/scenes/pull/587) ([@sd2k](https://github.com/sd2k))

#### Authors: 3

- Ben Sully ([@sd2k](https://github.com/sd2k))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.26.0 (Tue Jun 04 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Search / typing performance improvements [#763](https://github.com/grafana/scenes/pull/763) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.25.0 (Fri May 31 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHoc filters: Add support for adhoc filter value groups [#758](https://github.com/grafana/scenes/pull/758) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.24.4 (Thu May 30 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanelRenderer: Emit SetPanelAttention event [#716](https://github.com/grafana/scenes/pull/716) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v4.24.3 (Thu May 30 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Macros: Resolve browser timezone for `$__timezone` [#759](https://github.com/grafana/scenes/pull/759) ([@ivanortegaalba](https://github.com/ivanortegaalba))
  - Variables: Prioritize showing adhoc variable key and operator [#750](https://github.com/grafana/scenes/pull/750) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.24.2 (Wed May 29 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - MultiValueVariable: Fixes issue when value is all value but all value is not enabled [#757](https://github.com/grafana/scenes/pull/757) ([@torkelo](https://github.com/torkelo) [@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 2

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.24.1 (Tue May 28 2024)

#### 🐛 Bug Fix

- Plugin.json: update schema reference URL in scenes-app [#754](https://github.com/grafana/scenes/pull/754) ([@leventebalogh](https://github.com/leventebalogh))
- `@grafana/scenes`
  - Allow drag and dropping rows in valid states [#756](https://github.com/grafana/scenes/pull/756) ([@mdvictor](https://github.com/mdvictor))
  - fix: undefined check on RefreshPicker.autoOption [#751](https://github.com/grafana/scenes/pull/751) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 3

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.24.0 (Mon May 27 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneFlexLayout: Min width/height option was ignored [#749](https://github.com/grafana/scenes/pull/749) ([@edvard-falkskar](https://github.com/edvard-falkskar))

#### Authors: 1

- Edvard Falkskär ([@edvard-falkskar](https://github.com/edvard-falkskar))

---

# v4.23.1 (Wed May 22 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VariableValueSelect: Add missing data-testids for e2e [#742](https://github.com/grafana/scenes/pull/742) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.23.0 (Mon May 20 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - MultiValueVariable: Fixes setting value from url when url value is a custom all value [#738](https://github.com/grafana/scenes/pull/738) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.22.0 (Wed May 15 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Performance: Limit data layer state updates [#724](https://github.com/grafana/scenes/pull/724) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.21.1 (Tue May 14 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Group by: Do not allow custom options [#736](https://github.com/grafana/scenes/pull/736) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.21.0 (Tue May 14 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneVariableSet: Do not propagate variable value changes when a local variable has the same name [#729](https://github.com/grafana/scenes/pull/729) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - NestedScene: Don't show `cursor: pointer;` for everything [#735](https://github.com/grafana/scenes/pull/735) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.20.0 (Mon May 13 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
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

- `@grafana/scenes`
  - SceneDataTransformer: Performance optimizations [#725](https://github.com/grafana/scenes/pull/725) ([@torkelo](https://github.com/torkelo))
  - Variables: Do not update value when value and text are the same [#726](https://github.com/grafana/scenes/pull/726) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.18.0 (Fri May 10 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Detect new variable values when cloned [#727](https://github.com/grafana/scenes/pull/727) ([@torkelo](https://github.com/torkelo))
  - SceneObject: Handle new or removed behaviors [#731](https://github.com/grafana/scenes/pull/731) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.17.3 (Thu May 09 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHoc filters: Allow typing the same custom value [#723](https://github.com/grafana/scenes/pull/723) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.2 (Thu May 09 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFilters: clear filter value when key is changed [#714](https://github.com/grafana/scenes/pull/714) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.1 (Wed May 08 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHoc filters: Apply `isKeysOpen` state changes synchronously [#722](https://github.com/grafana/scenes/pull/722) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.17.0 (Wed May 08 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VariableSelect: Multi select design update and behavior improvements [#709](https://github.com/grafana/scenes/pull/709) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.16.0 (Wed May 08 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Types: Export `FieldConfigOverridesBuilder` [#719](https://github.com/grafana/scenes/pull/719) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v4.15.0 (Wed May 08 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneDataTransformer: Fixes transformer emitting untransformed series [#720](https://github.com/grafana/scenes/pull/720) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.14.2 (Tue May 07 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHoc filters: Allow adding custom value while loading [#721](https://github.com/grafana/scenes/pull/721) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.14.1 (Tue May 07 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Allow filter selectors to wrap [#715](https://github.com/grafana/scenes/pull/715) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.14.0 (Fri May 03 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHocFiltersVariable: create an opt-in state variable for using queries to filter the options [#713](https://github.com/grafana/scenes/pull/713) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 1

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))

---

# v4.13.2 (Wed May 01 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - MultiValueVariable: Fixes support for legacy All url value [#712](https://github.com/grafana/scenes/pull/712) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.13.1 (Wed May 01 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Chore: Bump various dependencies [#682](https://github.com/grafana/scenes/pull/682) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.13.0 (Fri Apr 26 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - sceneGraph: handle interpolations argument in interpolate [#708](https://github.com/grafana/scenes/pull/708) ([@sd2k](https://github.com/sd2k))

#### Authors: 1

- Ben Sully ([@sd2k](https://github.com/sd2k))

---

# v4.12.3 (Wed Apr 24 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Dashboard Migration: Add missing e2e selectors to some components [#648](https://github.com/grafana/scenes/pull/648) ([@axelavargas](https://github.com/axelavargas) [@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 2

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)
- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v4.12.2 (Wed Apr 24 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Support detecting new local time range [#707](https://github.com/grafana/scenes/pull/707) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.12.1 (Tue Apr 23 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix how the submenus appear for menus of type group [#704](https://github.com/grafana/scenes/pull/704) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.12.0 (Tue Apr 23 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Fixes issue updating instanceState [#702](https://github.com/grafana/scenes/pull/702) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.11.3 (Mon Apr 22 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdhocFilters: Show label for selected key [#690](https://github.com/grafana/scenes/pull/690) ([@ashharrison90](https://github.com/ashharrison90) [@bfmatei](https://github.com/bfmatei))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.11.2 (Mon Apr 22 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - GroupBy: Fetch options when opening menu [#687](https://github.com/grafana/scenes/pull/687) ([@ashharrison90](https://github.com/ashharrison90) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.11.1 (Wed Apr 17 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Interval variable: Make interval variable properly update on name change [#701](https://github.com/grafana/scenes/pull/701) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.11.0 (Wed Apr 17 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Fix ${__all_variables} not updating their value in panels [#698](https://github.com/grafana/scenes/pull/698) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v4.10.0 (Wed Apr 17 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - RefreshPicker: Fixed width when going betwen normal and loading state [#695](https://github.com/grafana/scenes/pull/695) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.9.0 (Tue Apr 16 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Annotations: Don't always execute annotations on activate [#635](https://github.com/grafana/scenes/pull/635) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.8.0 (Mon Apr 15 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - LocalValueVariable: Do not throw when missing parent variable [#691](https://github.com/grafana/scenes/pull/691) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.7.0 (Mon Apr 15 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneComponentWrapper: More robust activation [#692](https://github.com/grafana/scenes/pull/692) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.6.0 (Wed Apr 10 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneObjectBase: useState add options that make the new activation behavior optional [#688](https://github.com/grafana/scenes/pull/688) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.5.7 (Wed Apr 10 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Filters/GroupBy: Resolve queries only from active query runners [#685](https://github.com/grafana/scenes/pull/685) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.5.6 (Tue Apr 09 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Allow configuring hover header offset [#674](https://github.com/grafana/scenes/pull/674) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v4.5.5 (Tue Apr 09 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFiltersVariable: Fixes issue updating hide state causing variable to be deactivated and preventing it from being shown again [#679](https://github.com/grafana/scenes/pull/679) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.5.4 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Clone SceneQueryRunner together with _results [#681](https://github.com/grafana/scenes/pull/681) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.5.3 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneRefreshPicker: Show the auto calculated value when auto is selected [#680](https://github.com/grafana/scenes/pull/680) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.5.2 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Disallow drag and drop rows within uncollapsed rows [#671](https://github.com/grafana/scenes/pull/671) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.5.1 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- GrafanaMonitoring: Fixes the drilldown urls in monitoring app demo [#581](https://github.com/grafana/scenes/pull/581) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
  - Chore: Bump typescript version [#657](https://github.com/grafana/scenes/pull/657) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.5.0 (Fri Apr 05 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Do not apply the visualization's field config to annotation data frames [#659](https://github.com/grafana/scenes/pull/659) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 1

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v4.4.1 (Thu Apr 04 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Chore: Remove viz panel tooltip related code that is no longer needed [#675](https://github.com/grafana/scenes/pull/675) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.4.0 (Thu Apr 04 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneRefreshPicker: Implement mechanism for auto interval [#667](https://github.com/grafana/scenes/pull/667) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.3.0 (Wed Apr 03 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHoc Filters: Allow custom value [#670](https://github.com/grafana/scenes/pull/670) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v4.2.1 (Wed Apr 03 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - LiveNowTimer: The constructor doesn't receive a valid state [#662](https://github.com/grafana/scenes/pull/662) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v4.2.0 (Tue Apr 02 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Autofit: Fit widget in the screen depending on the height [#658](https://github.com/grafana/scenes/pull/658) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v4.1.2 (Tue Apr 02 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix issue where curly braces are always added to IntervalMacro. [#666](https://github.com/grafana/scenes/pull/666) ([@oscarkilhed](https://github.com/oscarkilhed))
  - AdHocFiltersVariable/GroupByVariable: Pass time range to getTagKeys calls [#665](https://github.com/grafana/scenes/pull/665) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 2

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))
- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.1.1 (Tue Apr 02 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix drag and drop panels in rows [#663](https://github.com/grafana/scenes/pull/663) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v4.1.0 (Tue Apr 02 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHocFiltersVariable: Pass scene queries to getTagValues calls [#664](https://github.com/grafana/scenes/pull/664) ([@bfmatei](https://github.com/bfmatei))

#### Authors: 1

- Bogdan Matei ([@bfmatei](https://github.com/bfmatei))

---

# v4.0.4 (Wed Mar 27 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Check if target datasource is matching the panel ds, if not set the target ds to panel ds. [#660](https://github.com/grafana/scenes/pull/660) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.0.3 (Fri Mar 22 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - MultiValueVariable: Fixes issue with initial url sync when using old All url value [#656](https://github.com/grafana/scenes/pull/656) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.0.2 (Fri Mar 22 2024)

#### 🐛 Bug Fix

- Chore: Bump to yarn 4 [#653](https://github.com/grafana/scenes/pull/653) ([@kaydelaney](https://github.com/kaydelaney))
- `@grafana/scenes`
  - ControlsLabel: style: use info icons for description [#654](https://github.com/grafana/scenes/pull/654) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 2

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v4.0.1 (Thu Mar 21 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Meaningful cloning [#652](https://github.com/grafana/scenes/pull/652) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v4.0.0 (Thu Mar 21 2024)

#### 💥 Breaking Change

- `@grafana/scenes`
  - DataLayers: Unifiy DataLayers (group of data layers) and a single data layer [#640](https://github.com/grafana/scenes/pull/640) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.14.0 (Wed Mar 20 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Add transformations to annotations dataframes [#651](https://github.com/grafana/scenes/pull/651) ([@javiruiz01](https://github.com/javiruiz01))
  - Add ability to opt out specifc queries from time window comparison [#650](https://github.com/grafana/scenes/pull/650) ([@domasx2](https://github.com/domasx2))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v3.13.3 (Fri Mar 15 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFilter: Correctly show the label for a matching default key [#645](https://github.com/grafana/scenes/pull/645) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v3.13.2 (Fri Mar 15 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridLayout: Fixes moving panels when opening dashboards [#644](https://github.com/grafana/scenes/pull/644) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.13.1 (Thu Mar 14 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Fixes incrementing structureRev [#643](https://github.com/grafana/scenes/pull/643) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.13.0 (Wed Mar 13 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - LiveNow: Move enabled property to state [#642](https://github.com/grafana/scenes/pull/642) ([@kaydelaney](https://github.com/kaydelaney))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - LiveNow: Fixes activation/deactivation issue and logic error with getTimeRange [#641](https://github.com/grafana/scenes/pull/641) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v3.12.0 (Mon Mar 11 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - PanelMigrations: Fixes incorrect panel.id in migration handler [#638](https://github.com/grafana/scenes/pull/638) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.11.0 (Mon Mar 11 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Support static keys in AdHocFiltersVariable [#612](https://github.com/grafana/scenes/pull/612) ([@ashharrison90](https://github.com/ashharrison90))

#### Authors: 1

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))

---

# v3.10.1 (Mon Mar 11 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Variables: Fixes issue with url sync and key value variables [#639](https://github.com/grafana/scenes/pull/639) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.10.0 (Thu Mar 07 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Maintain custom (invalid) variable values set via URL on initial load [#632](https://github.com/grafana/scenes/pull/632) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - LiveNow: Fix broken behavior [#637](https://github.com/grafana/scenes/pull/637) ([@kaydelaney](https://github.com/kaydelaney))
  - Scenes: Implement "Live now" feature [#618](https://github.com/grafana/scenes/pull/618) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 2

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.9.2 (Wed Mar 06 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Fixes issue updating field config [#636](https://github.com/grafana/scenes/pull/636) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.9.1 (Tue Mar 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - SceneObjectBase: Call self activation handlers before child data, time range and variable handlers [#628](https://github.com/grafana/scenes/pull/628) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.8.2 (Mon Mar 04 2024)

#### 🐛 Bug Fix

- RuntimeDataSource: Add QueryVariable to demo [#613](https://github.com/grafana/scenes/pull/613) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
  - Rows are draggable when scene layout is draggable [#626](https://github.com/grafana/scenes/pull/626) ([@mdvictor](https://github.com/mdvictor))
  - Style rows to show actions on entire group hover [#625](https://github.com/grafana/scenes/pull/625) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v3.8.1 (Wed Feb 28 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Group row title and actions together on the left side [#624](https://github.com/grafana/scenes/pull/624) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v3.8.0 (Mon Feb 26 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHocFilters: Auto focus value when key is selected [#614](https://github.com/grafana/scenes/pull/614) ([@torkelo](https://github.com/torkelo) [@darrenjaneczek](https://github.com/darrenjaneczek))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - feat: allow label for adhoc filter add button [#619](https://github.com/grafana/scenes/pull/619) ([@darrenjaneczek](https://github.com/darrenjaneczek))
  - fix: adhoc filter placeholder to "Select value" [#620](https://github.com/grafana/scenes/pull/620) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 2

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.7.0 (Fri Feb 23 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Pass container width to data provider always [#611](https://github.com/grafana/scenes/pull/611) ([@torkelo](https://github.com/torkelo))
  - SceneObjectBase: Minor optimization to setParent [#610](https://github.com/grafana/scenes/pull/610) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- Auto: Updating auto [#617](https://github.com/grafana/scenes/pull/617) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
  - Legend sorting fix [#616](https://github.com/grafana/scenes/pull/616) ([@xforman2](https://github.com/xforman2))

#### Authors: 2

- [@xforman2](https://github.com/xforman2)
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.6.1 (Tue Feb 20 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Fixes issue with non memoizable PanelData [#609](https://github.com/grafana/scenes/pull/609) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.6.0 (Mon Feb 19 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Update grafana peer dependencies [#570](https://github.com/grafana/scenes/pull/570) ([@leventebalogh](https://github.com/leventebalogh) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.5.0 (Wed Feb 14 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Add query caching options [#603](https://github.com/grafana/scenes/pull/603) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v3.4.1 (Wed Feb 14 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - VariableDependencyConfig: Support `*` to extract dependencies from every state path [#599](https://github.com/grafana/scenes/pull/599) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - Variables: Clear current value when no options are returned [#595](https://github.com/grafana/scenes/pull/595) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.2.1 (Tue Feb 13 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VariableDependencyConfig: do not scan state if `variableNames` is defined [#598](https://github.com/grafana/scenes/pull/598) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v3.2.0 (Tue Feb 13 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Improved way to detect changes to adhoc filters and group by variables [#596](https://github.com/grafana/scenes/pull/596) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.1.1 (Mon Feb 12 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFiltersVariable: Allow setting expression builder function [#582](https://github.com/grafana/scenes/pull/582) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v3.1.0 (Mon Feb 12 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - QueryController: Update global window query counter [#593](https://github.com/grafana/scenes/pull/593) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v3.0.0 (Mon Feb 12 2024)

### Release Notes

#### AdHocFiltersSet/Variable: Unify both objects as a scene variable (breaking change) ([#586](https://github.com/grafana/scenes/pull/586))

AdHocFilterSet is now removed from the library. AdHocFiltersVariable can now be used in both modes (auto and manual).  

To migrate replace AdHocFilterSet with AdHocFiltersVariable , the `applyMode` defaults to `auto` which is the new renamed value that was previously `same-datasource`.  Instead of adding this directly to a controls array add it to the variables array of a SceneVariableSet. It will then be rendered along with other variables via the VariableValueSelectors controls component. If you want to render ad hoc filters separately you can set `hide: VariableHide.hideVariable` so that the filters are not rendered by VariableValueSelectors and use the new component VariableValueControl that can render a specific variable.  

`AdHocFiltersVariable.create` is also removed as this separate factory function is no longer needed. If you where using `AdHocFiltersVariable.create` then switch to the normal constructor but be sure to pass in `applyMode: 'manual'` when you create it to preserve the same behavior as before.

---

#### 💥 Breaking Change

- `@grafana/scenes`
  - AdHocFiltersSet/Variable: Unify both objects as a scene variable (breaking change) [#586](https://github.com/grafana/scenes/pull/586) ([@torkelo](https://github.com/torkelo) [@ivanortegaalba](https://github.com/ivanortegaalba) [@dprokop](https://github.com/dprokop))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.7 (Sat Feb 10 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridLayoutRenderer: fix svg height unit [#588](https://github.com/grafana/scenes/pull/588) ([@erj826](https://github.com/erj826))

#### Authors: 1

- Eric Jacobson ([@erj826](https://github.com/erj826))

---

# v2.6.6 (Thu Feb 08 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - GroupBy: Add variable type guard [#583](https://github.com/grafana/scenes/pull/583) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.6.5 (Thu Feb 08 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - ResizeHandle: New style [#579](https://github.com/grafana/scenes/pull/579) ([@torkelo](https://github.com/torkelo))
  - ByVariableRepeater: Repeat layout for each variable value [#573](https://github.com/grafana/scenes/pull/573) ([@torkelo](https://github.com/torkelo))
  - QueryVariable: Fixes react testing act errors [#578](https://github.com/grafana/scenes/pull/578) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.4 (Wed Feb 07 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - TextBoxVariable: Fixes url sync key when name changes [#574](https://github.com/grafana/scenes/pull/574) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.2 (Tue Feb 06 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - GroupBy variable: Fix variable type [#571](https://github.com/grafana/scenes/pull/571) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.6.1 (Tue Feb 06 2024)

#### 🐛 Bug Fix

- Fix dev script for node_modules [#564](https://github.com/grafana/scenes/pull/564) ([@joshhunt](https://github.com/joshhunt))
- `@grafana/scenes`
  - Variable: Fixes performance issues with variables with many select options [#569](https://github.com/grafana/scenes/pull/569) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Josh Hunt ([@joshhunt](https://github.com/joshhunt))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.6.0 (Mon Feb 05 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SplitLayout: Make secondary pane optional [#546](https://github.com/grafana/scenes/pull/546) ([@cbos](https://github.com/cbos) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Cees Bos ([@cbos](https://github.com/cbos))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.5.1 (Mon Feb 05 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridLayout: Fixes missing resize handles [#566](https://github.com/grafana/scenes/pull/566) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.5.0 (Mon Feb 05 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Introduce GroupBy variable to allow passing group by dimensions to data sources [#548](https://github.com/grafana/scenes/pull/548) ([@ashharrison90](https://github.com/ashharrison90) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Ashley Harrison ([@ashharrison90](https://github.com/ashharrison90))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.4.0 (Thu Feb 01 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - UrlSync: Fixes overwrite issue where later state change overwrites earlier change [#555](https://github.com/grafana/scenes/pull/555) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.3.0 (Thu Feb 01 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneVariableSet: Cancel query when dependency changes [#557](https://github.com/grafana/scenes/pull/557) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix empty state adhoc filters [#560](https://github.com/grafana/scenes/pull/560) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 2

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v2.2.3 (Wed Jan 31 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix dataLayer subscriptions refresh on reactivation [#554](https://github.com/grafana/scenes/pull/554) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v2.2.2 (Wed Jan 31 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFiltersVariable: The `create()` factory supports `applyMode` as parameter [#553](https://github.com/grafana/scenes/pull/553) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v2.2.1 (Tue Jan 30 2024)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AdHocFiltersVariable: AdHocFilterSet is not activated when the parent variable is mounted [#550](https://github.com/grafana/scenes/pull/550) ([@ivanortegaalba](https://github.com/ivanortegaalba))

#### Authors: 1

- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))

---

# v2.2.0 (Tue Jan 30 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AdHocFiltersSet: Pass scene queries to getTagKeys calls [#544](https://github.com/grafana/scenes/pull/544) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v2.1.0 (Fri Jan 26 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Fixes issue with exemplar link [#540](https://github.com/grafana/scenes/pull/540) ([@cbos](https://github.com/cbos))
  - SceneDataTransformer: Fixes issue with getResultStream not emitting values when there are no transformations [#543](https://github.com/grafana/scenes/pull/543) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - Variables: Notify scene after each variable completion or value change [#525](https://github.com/grafana/scenes/pull/525) ([@torkelo](https://github.com/torkelo))

#### 🚀 Enhancement

- `@grafana/scenes`
  - UrlSync: Export new util functions [#529](https://github.com/grafana/scenes/pull/529) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.30.0 (Thu Jan 18 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneGridLayout: Support new visualization tooltips [#530](https://github.com/grafana/scenes/pull/530) ([@torkelo](https://github.com/torkelo))
  - Adhoc filters variable improvements [#518](https://github.com/grafana/scenes/pull/518) ([@javiruiz01](https://github.com/javiruiz01))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Revert "Chore: Update peer dependencies" [#533](https://github.com/grafana/scenes/pull/533) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 3

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.29.0 (Tue Jan 16 2024)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SplitLayout: Allow pane style overrides to be passed through [#531](https://github.com/grafana/scenes/pull/531) ([@kaydelaney](https://github.com/kaydelaney))

#### 🐛 Bug Fix

- Correct developer docs link in README [#522](https://github.com/grafana/scenes/pull/522) ([@annanay25](https://github.com/annanay25))
- `@grafana/scenes`
  - Variables: Checking if a dependency is loading should also check that dependency dependencies [#523](https://github.com/grafana/scenes/pull/523) ([@torkelo](https://github.com/torkelo))

#### Authors: 3

- Annanay Agarwal ([@annanay25](https://github.com/annanay25))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.6 (Sat Jan 06 2024)

#### 🐛 Bug Fix

- Update README with developer docs [#520](https://github.com/grafana/scenes/pull/520) ([@annanay25](https://github.com/annanay25))
- Moving the grafana monitoring demo app to scenes-app [#512](https://github.com/grafana/scenes/pull/512) ([@torkelo](https://github.com/torkelo))
- Demos: Adds an example with InteractiveTable with exandable rows that shows sub scenes [#505](https://github.com/grafana/scenes/pull/505) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
  - SceneTimeRange: Support delay now to avoid data drops in charts [#509](https://github.com/grafana/scenes/pull/509) ([@ivanortegaalba](https://github.com/ivanortegaalba))
  - Fix issue with duplicate annotations [#515](https://github.com/grafana/scenes/pull/515) ([@domasx2](https://github.com/domasx2))
  - SceneQueryRunner: Fix redundant execution on variable change [#519](https://github.com/grafana/scenes/pull/519) ([@domasx2](https://github.com/domasx2))
  - Splitter: Fixes small issue with keyboard control [#498](https://github.com/grafana/scenes/pull/498) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 5

- Annanay Agarwal ([@annanay25](https://github.com/annanay25))
- Domas ([@domasx2](https://github.com/domasx2))
- Ivan Ortega Alba ([@ivanortegaalba](https://github.com/ivanortegaalba))
- kay delaney ([@kaydelaney](https://github.com/kaydelaney))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.5 (Wed Dec 20 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - CSSGridLayout: Remove semi colon [#511](https://github.com/grafana/scenes/pull/511) ([@adrapereira](https://github.com/adrapereira))

#### Authors: 1

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))

---

# v1.28.4 (Wed Dec 20 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - CSSGridLayout: Lazy loading [#510](https://github.com/grafana/scenes/pull/510) ([@adrapereira](https://github.com/adrapereira) [@torkelo](https://github.com/torkelo))

#### Authors: 2

- Andre Pereira ([@adrapereira](https://github.com/adrapereira))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.3 (Tue Dec 19 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - IntervalVariable: Makes it return the original variable expression when data or request is not present [#508](https://github.com/grafana/scenes/pull/508) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.2 (Tue Dec 19 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Improve the way to find adhoc filter set [#506](https://github.com/grafana/scenes/pull/506) ([@torkelo](https://github.com/torkelo))
  - CustomVariable: Interpolate query [#502](https://github.com/grafana/scenes/pull/502) ([@torkelo](https://github.com/torkelo))
  - VizPanel Re-render skipDataQuery panels when time range change [#492](https://github.com/grafana/scenes/pull/492) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.1 (Wed Dec 13 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Variables: Fixes issue with chained variable and cascading updates [#501](https://github.com/grafana/scenes/pull/501) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.28.0 (Thu Dec 07 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SplitLayout: Allow setting initial size [#496](https://github.com/grafana/scenes/pull/496) ([@cedricziel](https://github.com/cedricziel) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Cedric Ziel ([@cedricziel](https://github.com/cedricziel))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.27.0 (Tue Dec 05 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Expose events for interactions [#491](https://github.com/grafana/scenes/pull/491) ([@dprokop](https://github.com/dprokop))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - QueryVariable: Run query with scene time range on when configured to run on load [#490](https://github.com/grafana/scenes/pull/490) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.26.0 (Mon Dec 04 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables:  Query - Add optional `definition` prop to state [#489](https://github.com/grafana/scenes/pull/489) ([@axelavargas](https://github.com/axelavargas))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Simplify interval macro [#488](https://github.com/grafana/scenes/pull/488) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Alexa V ([@axelavargas](https://github.com/axelavargas))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.25.0 (Fri Dec 01 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Macros: Support $_interval[_ms] variable [#487](https://github.com/grafana/scenes/pull/487) ([@dprokop](https://github.com/dprokop))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanelMenu: Fix auto focus / keyboard navigation issue [#483](https://github.com/grafana/scenes/pull/483) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.6 (Mon Nov 27 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Fixes issue with cloned scene query runner would issue new query [#482](https://github.com/grafana/scenes/pull/482) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.5 (Fri Nov 24 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneQueryRunner: Fixes issue with waiting for variables [#481](https://github.com/grafana/scenes/pull/481) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.4 (Fri Nov 24 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanelRenderer: Round visualization width pushed to data provider [#478](https://github.com/grafana/scenes/pull/478) ([@dprokop](https://github.com/dprokop))

#### ⚠️ Pushed to `main`

- `@grafana/scenes`
  - Revert "VizPanelRenderer: Round viz width pushed to data provider" ([@dprokop](https://github.com/dprokop))
  - VizPanelRenderer: Round viz width pushed to data provider ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.3 (Thu Nov 23 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Only pass data layers to panel when plugin supports them [#477](https://github.com/grafana/scenes/pull/477) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.2 (Wed Nov 22 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Variables: Clear error state [#476](https://github.com/grafana/scenes/pull/476) ([@torkelo](https://github.com/torkelo))
  - Variables: Fixes validation issue where the current saved value only matches text representation [#475](https://github.com/grafana/scenes/pull/475) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.24.1 (Tue Nov 21 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Fix non-null assertion in SceneQueryRunner [#474](https://github.com/grafana/scenes/pull/474) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.24.0 (Tue Nov 21 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Add type guards for variables [#472](https://github.com/grafana/scenes/pull/472) ([@javiruiz01](https://github.com/javiruiz01))

#### Authors: 1

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))

---

# v1.23.1 (Fri Nov 17 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - fix: compare time ranges using actual unix time vs objects [#468](https://github.com/grafana/scenes/pull/468) ([@darrenjaneczek](https://github.com/darrenjaneczek))

#### Authors: 1

- Darren Janeczek ([@darrenjaneczek](https://github.com/darrenjaneczek))

---

# v1.23.0 (Fri Nov 17 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Add natural sort from core grafana to query variables [#459](https://github.com/grafana/scenes/pull/459) ([@axelavargas](https://github.com/axelavargas))

#### 🐛 Bug Fix

- `@grafana/scenes`
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

- `@grafana/scenes`
  - Variables: Fixes url sync issue for key/value multi value variables [#455](https://github.com/grafana/scenes/pull/455) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.22.0 (Mon Nov 13 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneQueryRunner: Handle alert states data layer [#454](https://github.com/grafana/scenes/pull/454) ([@dprokop](https://github.com/dprokop) [@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Urls: Make sure urls include sub path [#434](https://github.com/grafana/scenes/pull/434) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.21.1 (Thu Nov 09 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Variables: Register variable macro [#452](https://github.com/grafana/scenes/pull/452) ([@torkelo](https://github.com/torkelo))
  - Variables: Support for variables on lower levels to depend on variables on higher levels [#443](https://github.com/grafana/scenes/pull/443) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Handle empty arrays when merging new panel options [#447](https://github.com/grafana/scenes/pull/447) ([@javiruiz01](https://github.com/javiruiz01))
  - PanelContext: Eventbus should not filter out local events [#445](https://github.com/grafana/scenes/pull/445) ([@torkelo](https://github.com/torkelo))
  - Variables: Support __org and __user variable macros [#449](https://github.com/grafana/scenes/pull/449) ([@torkelo](https://github.com/torkelo))
  - SceneQueryRunner: Fixes adhoc filters when using a variable data source [#422](https://github.com/grafana/scenes/pull/422) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Support passing legacyPanelId to PanelProps [#446](https://github.com/grafana/scenes/pull/446) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Javier Ruiz ([@javiruiz01](https://github.com/javiruiz01))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.21.0 (Mon Nov 06 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Multi select batch update [#410](https://github.com/grafana/scenes/pull/410) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- DemoList: Fixes demo list card height [#435](https://github.com/grafana/scenes/pull/435) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
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

- `@grafana/scenes`
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

- `@grafana/scenes`
  - Variables: Fixes SQL formatting and escaping double quotes [#433](https://github.com/grafana/scenes/pull/433) ([@piggito](https://github.com/piggito) [@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- [cr] adds docs for SceneCSSGridLayout [#423](https://github.com/grafana/scenes/pull/423) ([@jewbetcha](https://github.com/jewbetcha) [@torkelo](https://github.com/torkelo))
- Refactor demo list page, use grid layout, add search [#432](https://github.com/grafana/scenes/pull/432) ([@torkelo](https://github.com/torkelo))
- `@grafana/scenes`
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

- `@grafana/scenes`
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

- `@grafana/scenes`
  - AdHocVariable: Fixes trailing comma [#411](https://github.com/grafana/scenes/pull/411) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.18.0 (Thu Oct 12 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Adds extendPanelContext so that consumers can control some of the PanelContext functions [#409](https://github.com/grafana/scenes/pull/409) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.17.0 (Wed Oct 11 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneTimePicker: Add posibility to navigate backwards/forwards an absolute time range [#408](https://github.com/grafana/scenes/pull/408) ([@kaydelaney](https://github.com/kaydelaney))

#### Authors: 1

- kay delaney ([@kaydelaney](https://github.com/kaydelaney))

---

# v1.16.0 (Wed Oct 11 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneVariableSet: isVariableLoadingOrWaitingToUpdate should ignore isActive state [#405](https://github.com/grafana/scenes/pull/405) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.15.1 (Wed Oct 11 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Scenes: Interval Variable now considers $__auto_interval [#407](https://github.com/grafana/scenes/pull/407) ([@axelavargas](https://github.com/axelavargas))

#### Authors: 1

- Alexa V ([@axelavargas](https://github.com/axelavargas))

---

# v1.15.0 (Tue Oct 10 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Markup: element data keys changes [#403](https://github.com/grafana/scenes/pull/403) ([@torkelo](https://github.com/torkelo))
  - QueryVariable: Fix sort default value [#398](https://github.com/grafana/scenes/pull/398) ([@torkelo](https://github.com/torkelo))
  - QueryVariable: Support for queries that contain "$__searchFilter" [#395](https://github.com/grafana/scenes/pull/395) ([@torkelo](https://github.com/torkelo))
  - TextBoxVariable: Fixes and make it auto size [#394](https://github.com/grafana/scenes/pull/394) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Add support for a custom migration handler [#396](https://github.com/grafana/scenes/pull/396) ([@torkelo](https://github.com/torkelo))
  - SceneAppPage: Fix enrichDataRequest call for drilldown pages [#402](https://github.com/grafana/scenes/pull/402) ([@torkelo](https://github.com/torkelo))
  - ActWhenVariableChanged: Add behavior to onChange callback [#393](https://github.com/grafana/scenes/pull/393) ([@torkelo](https://github.com/torkelo))
  - Variables: Updates the demo scene [#388](https://github.com/grafana/scenes/pull/388) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.14.0 (Wed Oct 04 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Fix issue with all value state and no options [#391](https://github.com/grafana/scenes/pull/391) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.13.0 (Wed Oct 04 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Compatability: Add global window object that points to the current active EmbeddedScene [#390](https://github.com/grafana/scenes/pull/390) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.12.0 (Tue Oct 03 2023)

#### 🚀 Enhancement

- AdhocFilters: Add docs for AdhocFilterSet and AdhocFiltersVariable [#377](https://github.com/grafana/scenes/pull/377) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))
- `@grafana/scenes`
  - AdhocFilters: Pass filters via request object [#382](https://github.com/grafana/scenes/pull/382) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneTimeRange: Implement onZoom behavior [#374](https://github.com/grafana/scenes/pull/374) ([@polibb](https://github.com/polibb))

#### Authors: 3

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Polina Boneva ([@polibb](https://github.com/polibb))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.11.1 (Tue Oct 03 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneAppPageView: Fixes react and scene state missmatch [#381](https://github.com/grafana/scenes/pull/381) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.11.0 (Tue Oct 03 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - TimePicker: Show and update fiscal year month [#386](https://github.com/grafana/scenes/pull/386) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.10.0 (Mon Oct 02 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Implement Interval Variable [#365](https://github.com/grafana/scenes/pull/365) ([@axelavargas](https://github.com/axelavargas))
  - Variables: Support skipUrlSync option [#376](https://github.com/grafana/scenes/pull/376) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneFlexLayout: Export SceneFlexItemLike [#385](https://github.com/grafana/scenes/pull/385) ([@torkelo](https://github.com/torkelo))
  - SceneAppPage: Custom fallback page [#380](https://github.com/grafana/scenes/pull/380) ([@domasx2](https://github.com/domasx2))

#### Authors: 3

- Alexa V ([@axelavargas](https://github.com/axelavargas))
- Domas ([@domasx2](https://github.com/domasx2))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.9.0 (Fri Sep 29 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneVariableSet: Show and log errors [#371](https://github.com/grafana/scenes/pull/371) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneTimeRange: Add weekStart support and make sure fiscalYearMonth is used everywhere [#375](https://github.com/grafana/scenes/pull/375) ([@torkelo](https://github.com/torkelo))
  - EmbeddedScene: Patch TimeSrv [#379](https://github.com/grafana/scenes/pull/379) ([@dprokop](https://github.com/dprokop))
  - AdHocFiltersSet and AdhocFiltersVariable with manual and automatic modes [#346](https://github.com/grafana/scenes/pull/346) ([@torkelo](https://github.com/torkelo))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.8.1 (Wed Sep 27 2023)

#### 🐛 Bug Fix

- Demos: Fix panel repeater demo [#369](https://github.com/grafana/scenes/pull/369) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.8.0 (Mon Sep 25 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - VizPanel: Allow options and field config updates [#363](https://github.com/grafana/scenes/pull/363) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.7.1 (Mon Sep 25 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AnnotationsDataLayer: Support query request enriching [#364](https://github.com/grafana/scenes/pull/364) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.7.0 (Mon Sep 25 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneTimeRangeCompare: Enable URL sync [#360](https://github.com/grafana/scenes/pull/360) ([@dprokop](https://github.com/dprokop))

#### 🐛 Bug Fix

- Prevent publishing to github pages [#362](https://github.com/grafana/scenes/pull/362) ([@tolzhabayev](https://github.com/tolzhabayev))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# v1.6.0 (Fri Sep 22 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - AnnotationsDataLayer: Add variables support [#358](https://github.com/grafana/scenes/pull/358) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.3 (Fri Sep 22 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneApp: Introduce a useSceneApp hook that should replace useMemo as method of caching SceneApp instance [#357](https://github.com/grafana/scenes/pull/357) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.5.2 (Thu Sep 21 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneDataTransformer: Handle transformation errors [#354](https://github.com/grafana/scenes/pull/354) ([@dprokop](https://github.com/dprokop))
  - AnnotationsDataLayer: Events deduplication [#351](https://github.com/grafana/scenes/pull/351) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.1 (Wed Sep 20 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AnnotationsDataLayer: Provide inheritance extension points [#347](https://github.com/grafana/scenes/pull/347) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.5.0 (Wed Sep 20 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Fix issue with previous fix [#350](https://github.com/grafana/scenes/pull/350) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.4.0 (Wed Sep 20 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - Variables: Fixes issue with running variable queries with custom or legacy runner [#348](https://github.com/grafana/scenes/pull/348) ([@torkelo](https://github.com/torkelo))
  - QueryVariable: Fixes queries with older model [#340](https://github.com/grafana/scenes/pull/340) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.3.3 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneAppPage: Fix infinite recurision of enrichDataRequest [#345](https://github.com/grafana/scenes/pull/345) ([@torkelo](https://github.com/torkelo))
  - Data layer controls: Allow hiding [#344](https://github.com/grafana/scenes/pull/344) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.3.2 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - Annotations filtering operator: Correctly populate filtered frames [#343](https://github.com/grafana/scenes/pull/343) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.3.1 (Mon Sep 18 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - AnnotationsDataLayer: Handle data source error [#342](https://github.com/grafana/scenes/pull/342) ([@dprokop](https://github.com/dprokop))
  - DataLayers: Allow cancelling layers from layer control [#337](https://github.com/grafana/scenes/pull/337) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.3.0 (Mon Sep 18 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - NestedScene: Update design to match grid row, add controls property and update demo scene to include variables [#335](https://github.com/grafana/scenes/pull/335) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - VizPanel: Support async migration handlers [#341](https://github.com/grafana/scenes/pull/341) ([@torkelo](https://github.com/torkelo))
  - DataLayers: Allow toggling individual layers on/off [#333](https://github.com/grafana/scenes/pull/333) ([@dprokop](https://github.com/dprokop))
  - Data layers:  Annotations [#328](https://github.com/grafana/scenes/pull/328) ([@dprokop](https://github.com/dprokop))
  - Data layers:  Isolated change [#325](https://github.com/grafana/scenes/pull/325) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.2.0 (Wed Sep 13 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - SceneObject: Add getRef for easier SceneObjectRef usage [#330](https://github.com/grafana/scenes/pull/330) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneControlsSpacer: Fix flickering [#332](https://github.com/grafana/scenes/pull/332) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.1.1 (Sat Sep 09 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridLayout: Fix toggle row issue [#326](https://github.com/grafana/scenes/pull/326) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.1.0 (Thu Sep 07 2023)

#### 🚀 Enhancement

- License: Switch to Apache 2.0 [#327](https://github.com/grafana/scenes/pull/327) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v1.0.0 (Wed Sep 06 2023)

#### 💥 Breaking Change

- `@grafana/scenes`
  - Scenes 1.0 release prep [#323](https://github.com/grafana/scenes/pull/323) ([@dprokop](https://github.com/dprokop))

#### Authors: 1

- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v0.29.2 (Wed Sep 06 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneObject: Support changing $data, $timeRange and $variables during the active phase [#324](https://github.com/grafana/scenes/pull/324) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.29.1 (Tue Sep 05 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridRow: Small design change and fixes, add actions support [#321](https://github.com/grafana/scenes/pull/321) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.29.0 (Tue Sep 05 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
  - TestVariable: Add optionsToReturn and other unrelated changes [#314](https://github.com/grafana/scenes/pull/314) ([@torkelo](https://github.com/torkelo))
  - Variables: New LocalValueVariable to better support repeating panels [#317](https://github.com/grafana/scenes/pull/317) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Remove left-over isDraggable/isResizable state [#315](https://github.com/grafana/scenes/pull/315) ([@torkelo](https://github.com/torkelo))
  - QueryVariable: Support null ds [#316](https://github.com/grafana/scenes/pull/316) ([@torkelo](https://github.com/torkelo))
  - SceneTimeRangeTransformerBase [#312](https://github.com/grafana/scenes/pull/312) ([@torkelo](https://github.com/torkelo))
  - VizPanel: Allow panels to rendered without layout parent [#302](https://github.com/grafana/scenes/pull/302) ([@torkelo](https://github.com/torkelo))

#### 🐛 Bug Fix

- `@grafana/scenes`
  - MultiValueVariable: Fix url sync for isMulti when default value is not an array [#318](https://github.com/grafana/scenes/pull/318) ([@torkelo](https://github.com/torkelo))
  - DataQueryRequest enricher [#311](https://github.com/grafana/scenes/pull/311) ([@torkelo](https://github.com/torkelo) [@dprokop](https://github.com/dprokop))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.28.1 (Thu Aug 31 2023)

#### 🐛 Bug Fix

- `@grafana/scenes`
  - SceneGridLayout: Remove z-index [#308](https://github.com/grafana/scenes/pull/308) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v0.28.0 (Thu Aug 31 2023)

#### 🚀 Enhancement

- `@grafana/scenes`
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
