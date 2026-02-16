import { getUrlWithAppState } from './components/SceneApp/utils';
import { registerRuntimePanelPlugin } from './components/VizPanel/registerRuntimePanelPlugin';
import { cloneSceneObjectState } from './core/sceneGraph/cloneSceneObject';
import { registerRuntimeDataSource } from './querying/RuntimeDataSource';
import { getUrlState, syncStateFromSearchParams } from './services/utils';
import { buildPathIdFor } from './utils/pathId';
import { isRepeatCloneOrChildOf } from './utils/utils';

import { registerVariableMacro } from './variables/macros';
import {
  escapeLabelValueInExactSelector,
  escapeLabelValueInRegexSelector,
  escapeURLDelimiters,
  renderPrometheusLabelFilters,
} from './variables/utils';
import {
  isAdHocVariable,
  isQueryVariable,
  isTextBoxVariable,
  isCustomVariable,
  isDataSourceVariable,
  isConstantVariable,
  isIntervalVariable,
  isGroupByVariable,
  isSwitchVariable,
} from './variables/variants/guards';

export * from './core/types';
export * from './core/events';
export { sceneGraph } from './core/sceneGraph';
export * as behaviors from './behaviors';
export * as performanceUtils from './performance';
export { writePerformanceLog } from './utils/writePerformanceLog';
export * as dataLayers from './querying/layers';

export { SceneObjectBase, useSceneObjectState } from './core/SceneObjectBase';
export { SceneDataNode } from './core/SceneDataNode';
export { SceneTimeRange } from './core/SceneTimeRange';
export { SceneTimeZoneOverride } from './core/SceneTimeZoneOverride';

export { SceneQueryRunner, type QueryRunnerState } from './querying/SceneQueryRunner';
export { DataProviderProxy } from './querying/DataProviderProxy';
export {
  type ExtraQueryDescriptor,
  type ExtraQueryProvider,
  type ExtraQueryDataProcessor,
} from './querying/ExtraQueryProvider';
export { SceneDataLayerSet, SceneDataLayerSetBase } from './querying/SceneDataLayerSet';
export { SceneDataLayerBase } from './querying/layers/SceneDataLayerBase';
export { SceneDataLayerControls } from './querying/layers/SceneDataLayerControls';
export { SceneDataTransformer, type SceneDataTransformerState } from './querying/SceneDataTransformer';
export { registerQueryWithController } from './querying/registerQueryWithController';
export { registerRuntimeDataSource, RuntimeDataSource } from './querying/RuntimeDataSource';
export type {
  SceneQueryControllerLike,
  SceneQueryControllerEntryType,
  SceneQueryControllerEntry,
} from './behaviors/types';

export * from './variables/types';
export { VariableDependencyConfig } from './variables/VariableDependencyConfig';
export { formatRegistry, type FormatVariable } from './variables/interpolation/formatRegistry';
export { VariableValueSelectors } from './variables/components/VariableValueSelectors';
export { VariableValueControl } from './variables/components/VariableValueControl';
export { SceneVariableSet } from './variables/sets/SceneVariableSet';
export { ConstantVariable } from './variables/variants/ConstantVariable';
export { CustomVariable } from './variables/variants/CustomVariable';
export { SwitchVariable } from './variables/variants/SwitchVariable';
export { DataSourceVariable } from './variables/variants/DataSourceVariable';
export { QueryVariable } from './variables/variants/query/QueryVariable';
export { TestVariable } from './variables/variants/TestVariable';
export { TextBoxVariable } from './variables/variants/TextBoxVariable';
export { ScopesVariable } from './variables/variants/ScopesVariable';
export {
  MultiValueVariable,
  type MultiValueVariableState,
  type VariableGetOptionsArgs,
} from './variables/variants/MultiValueVariable';
export { LocalValueVariable } from './variables/variants/LocalValueVariable';
export { IntervalVariable } from './variables/variants/IntervalVariable';
export {
  AdHocFiltersVariable,
  OPERATORS,
  GROUP_BY_OPERATOR_VALUE,
  type OperatorDefinition,
} from './variables/adhoc/AdHocFiltersVariable';
export type { AdHocFilterWithLabels } from './variables/adhoc/AdHocFiltersVariable';
export type {
  AdHocFiltersController,
  AdHocFiltersControllerState,
} from './variables/adhoc/controller/AdHocFiltersController';
export { AdHocFiltersVariableController } from './variables/adhoc/controller/AdHocFiltersVariableController';
export { AdHocFiltersComboboxRenderer } from './variables/adhoc/AdHocFiltersCombobox/AdHocFiltersComboboxRenderer';
export { GroupByVariable } from './variables/groupby/GroupByVariable';
export { type MacroVariableConstructor } from './variables/macros/types';
export { escapeUrlPipeDelimiters, getQueriesForVariables } from './variables/utils';

export { type UrlSyncManagerLike, UrlSyncManager, NewSceneObjectAddedEvent } from './services/UrlSyncManager';
export { useUrlSync } from './services/useUrlSync';
export { UrlSyncContextProvider } from './services/UrlSyncContextProvider';
export { SceneObjectUrlSyncConfig } from './services/SceneObjectUrlSyncConfig';

export { EmbeddedScene, type EmbeddedSceneState } from './components/EmbeddedScene';
export { VizPanel, type VizPanelState } from './components/VizPanel/VizPanel';
export { VizPanelMenu } from './components/VizPanel/VizPanelMenu';
export { VizPanelExploreButton } from './components/VizPanel/VizPanelExploreButton';
export { NestedScene } from './components/NestedScene';
export { SceneCanvasText } from './components/SceneCanvasText';
export { SceneToolbarButton, SceneToolbarInput } from './components/SceneToolbarButton';
export { SceneTimePicker } from './components/SceneTimePicker';
export { SceneRefreshPicker, type SceneRefreshPickerState } from './components/SceneRefreshPicker';
export { SceneTimeRangeTransformerBase } from './core/SceneTimeRangeTransformerBase';
export { SceneTimeRangeCompare } from './components/SceneTimeRangeCompare';
export { SceneByFrameRepeater } from './components/SceneByFrameRepeater';
export { SceneByVariableRepeater } from './components/SceneByVariableRepeater';
export { SceneControlsSpacer } from './components/SceneControlsSpacer';
export {
  SceneFlexLayout,
  SceneFlexItem,
  type SceneFlexItemState,
  type SceneFlexItemLike,
} from './components/layout/SceneFlexLayout';
export { SceneCSSGridLayout, SceneCSSGridItem } from './components/layout/CSSGrid/SceneCSSGridLayout';
export { SceneGridLayout } from './components/layout/grid/SceneGridLayout';
export { SceneGridLayoutDragStartEvent } from './components/layout/grid/types';
export { SceneGridItem } from './components/layout/grid/SceneGridItem';
export { SceneGridRow } from './components/layout/grid/SceneGridRow';
export { type SceneGridItemStateLike, type SceneGridItemLike } from './components/layout/grid/types';
export { SplitLayout } from './components/layout/split/SplitLayout';
export { LazyLoader } from './components/layout/LazyLoader';
export {
  type SceneAppPageLike,
  type SceneRouteMatch,
  type SceneAppPageState,
  type SceneAppDrilldownView,
  type SceneAppRoute,
} from './components/SceneApp/types';
export { SceneApp, useSceneApp } from './components/SceneApp/SceneApp';
export { SceneAppPage } from './components/SceneApp/SceneAppPage';
export { SceneReactObject } from './components/SceneReactObject';
export { SceneObjectRef } from './core/SceneObjectRef';
export {
  PanelBuilders,
  PanelOptionsBuilders,
  FieldConfigBuilders,
  FieldConfigOverridesBuilder,
} from './core/PanelBuilders';
export { FieldConfigBuilder } from './core/PanelBuilders/FieldConfigBuilder';
export { VizPanelBuilder } from './core/PanelBuilders/VizPanelBuilder';
export { SceneDebugger } from './components/SceneDebugger/SceneDebugger';
export { VariableValueSelectWrapper } from './variables/components/VariableValueSelectors';
export { ControlsLabel } from './utils/ControlsLabel';
export { MultiOrSingleValueSelect } from './variables/components/VariableValueSelect';
export { VizConfigBuilder } from './core/PanelBuilders/VizConfigBuilder';
export { VizConfigBuilders } from './core/PanelBuilders/VizConfigBuilders';
export { type VizConfig } from './core/PanelBuilders/types';

export const sceneUtils = {
  getUrlWithAppState,
  registerRuntimePanelPlugin,
  registerRuntimeDataSource,
  registerVariableMacro,
  cloneSceneObjectState,
  syncStateFromSearchParams,
  getUrlState,
  renderPrometheusLabelFilters,
  escapeLabelValueInRegexSelector,
  escapeLabelValueInExactSelector,
  escapeURLDelimiters,

  // Variable guards
  isAdHocVariable,
  isConstantVariable,
  isCustomVariable,
  isDataSourceVariable,
  isIntervalVariable,
  isQueryVariable,
  isTextBoxVariable,
  isGroupByVariable,
  isSwitchVariable,
  isRepeatCloneOrChildOf,
  buildPathIdFor,
};

export { SafeSerializableSceneObject } from './utils/SafeSerializableSceneObject';
export { getExploreURL } from './utils/explore';
export { loadResources } from './utils/loadResources';
export { PATH_ID_SEPARATOR } from './utils/pathId';
