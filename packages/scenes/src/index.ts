import { getUrlWithAppState } from './components/SceneApp/utils';
import { registerRuntimePanelPlugin } from './components/VizPanel/registerRuntimePanelPlugin';
import { cloneSceneObjectState } from './core/sceneGraph/utils';
import { registerRuntimeDataSource } from './querying/RuntimeDataSource';
import { getUrlState, syncStateFromSearchParams } from './services/utils';
import { registerVariableMacro } from './variables/macros';
import { renderPrometheusLabelFilters } from './variables/utils';
import {
  isAdHocVariable,
  isQueryVariable,
  isTextBoxVariable,
  isCustomVariable,
  isDataSourceVariable,
  isConstantVariable,
  isIntervalVariable,
  isGroupByVariable,
} from './variables/variants/guards';

export * from './core/types';
export * from './core/events';
export { sceneGraph } from './core/sceneGraph';
export * as behaviors from './behaviors';
export * as dataLayers from './querying/layers';

export { SceneObjectBase } from './core/SceneObjectBase';
export { SceneDataNode } from './core/SceneDataNode';
export { SceneTimeRange } from './core/SceneTimeRange';
export { SceneTimeZoneOverride } from './core/SceneTimeZoneOverride';

export { SceneQueryRunner, type QueryRunnerState } from './querying/SceneQueryRunner';
export { SceneDataLayerSet, SceneDataLayerSetBase } from './querying/SceneDataLayerSet';
export { SceneDataLayerBase } from './querying/layers/SceneDataLayerBase';
export { SceneDataLayerControls } from './querying/layers/SceneDataLayerControls';
export { SceneDataTransformer } from './querying/SceneDataTransformer';
export { registerQueryWithController } from './querying/registerQueryWithController';
export { registerRuntimeDataSource, RuntimeDataSource } from './querying/RuntimeDataSource';
export type {
  SceneQueryControllerLike,
  SceneQueryControllerEntryType,
  SceneQueryControllerEntry,
} from './behaviors/SceneQueryController';

export * from './variables/types';
export { VariableDependencyConfig } from './variables/VariableDependencyConfig';
export { formatRegistry, type FormatVariable } from './variables/interpolation/formatRegistry';
export { VariableValueSelectors } from './variables/components/VariableValueSelectors';
export { VariableValueControl } from './variables/components/VariableValueControl';
export { SceneVariableSet } from './variables/sets/SceneVariableSet';
export { ConstantVariable } from './variables/variants/ConstantVariable';
export { CustomVariable } from './variables/variants/CustomVariable';
export { DataSourceVariable } from './variables/variants/DataSourceVariable';
export { QueryVariable } from './variables/variants/query/QueryVariable';
export { TestVariable } from './variables/variants/TestVariable';
export { TextBoxVariable } from './variables/variants/TextBoxVariable';
export { MultiValueVariable } from './variables/variants/MultiValueVariable';
export { LocalValueVariable } from './variables/variants/LocalValueVariable';
export { IntervalVariable } from './variables/variants/IntervalVariable';
export { AdHocFiltersVariable } from './variables/adhoc/AdHocFiltersVariable';
export { GroupByVariable } from './variables/groupby/GroupByVariable';
export { type MacroVariableConstructor } from './variables/macros/types';

export { type UrlSyncManagerLike, UrlSyncManager, getUrlSyncManager } from './services/UrlSyncManager';
export { SceneObjectUrlSyncConfig } from './services/SceneObjectUrlSyncConfig';

export { EmbeddedScene, type EmbeddedSceneState } from './components/EmbeddedScene';
export { VizPanel, type VizPanelState } from './components/VizPanel/VizPanel';
export { VizPanelMenu } from './components/VizPanel/VizPanelMenu';
export { NestedScene } from './components/NestedScene';
export { SceneCanvasText } from './components/SceneCanvasText';
export { SceneToolbarButton, SceneToolbarInput } from './components/SceneToolbarButton';
export { SceneTimePicker } from './components/SceneTimePicker';
export { SceneRefreshPicker } from './components/SceneRefreshPicker';
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
export { SceneGridItem } from './components/layout/grid/SceneGridItem';
export { SceneGridRow } from './components/layout/grid/SceneGridRow';
export { type SceneGridItemStateLike, type SceneGridItemLike } from './components/layout/grid/types';
export { SplitLayout } from './components/layout/split/SplitLayout';
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
export { PanelBuilders, PanelOptionsBuilders, FieldConfigBuilders } from './core/PanelBuilders';
export { VizPanelBuilder } from './core/PanelBuilders/VizPanelBuilder';
export { SceneDebugger } from './components/SceneDebugger/SceneDebugger';

export const sceneUtils = {
  getUrlWithAppState,
  registerRuntimePanelPlugin,
  registerRuntimeDataSource,
  registerVariableMacro,
  cloneSceneObjectState,
  syncStateFromSearchParams,
  getUrlState,
  renderPrometheusLabelFilters,

  // Variable guards
  isAdHocVariable,
  isConstantVariable,
  isCustomVariable,
  isDataSourceVariable,
  isIntervalVariable,
  isQueryVariable,
  isTextBoxVariable,
  isGroupByVariable,
};
