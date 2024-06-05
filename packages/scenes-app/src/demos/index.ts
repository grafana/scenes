import { SceneAppPage, SceneAppPageState } from '@grafana/scenes';
import { getRuntimePanelPluginDemo } from './runtimePanelPlugin';
import { getBehaviorsDemo } from './behaviors/behaviorsDemo';
import { getDynamicPageDemo } from './dynamicPage';
import { getFlexLayoutTest } from './flexLayout';
import { getGridLayoutTest } from './grid';
import { getGridWithRowLayoutTest } from './gridWithRow';
import { getLazyLoadDemo } from './lazyLoad';
import { getPanelContextDemoScene } from './panelContext';
import { getPanelMenuTest } from './panelMenu';
import { getPanelRepeaterTest } from './panelRepeater';
import { getQueryEditorDemo } from './queryEditor';
import { getResponsiveLayoutDemo } from './responsiveLayout';
import { getVariablesDemo } from './variables';
import { getDrilldownsAppPageScene } from './withDrilldown/WithDrilldown';
import { getTimeZoneTest } from './timeZones';
import { getSplitTest } from './split';
import { getQueryCancellationTest } from './queryCancellation';
import { getRuntimeDataSourceDemo } from './runtimeDataSourceDemo';
import { getDocsExamples } from './docs-examples';
import { getTimeRangeComparisonTest } from './timeRangeComparison';
import { getCursorSyncTest } from './cursorSync';
import { getAnnotationsDemo } from './annotations';
import { getAdhocFiltersDemo } from './adhocFiltersDemo';
import { getGroupByStatic } from './groupByStatic';
import { getGroupByDatasource } from './groupByDatasource';
import { getTransformationsTest } from './transformations';
import { getDynamicVizOptionsTest } from './dynamicPanelOptions';
import { getDataFilteringTest } from './filteringData';
import { getNestedScenesAndVariablesDemo } from './nestedVariables';
import { getCssGridLayoutDemo } from './cssGridLayoutDemo';
import { getPanelHeaderActions } from './panelHeaderActions';
import { getVerticalControlsLayoutDemo } from './verticalControlsLayoutDemo';
import { getInteractiveTableDemo } from './interactiveTableDemo';
import { getVariableRepeaterDemo } from './variableRepeater';
import { getQueryControllerDemo } from './queryController';
import { getDynamicDataLayersDemo } from './dynamicDataLayers';
import { getPanelTimeRangeHandlerDemoScene } from './panelTimeRangeHandler';

export interface DemoDescriptor {
  title: string;
  getPage: (defaults: SceneAppPageState) => SceneAppPage;
}

export function getDemos(): DemoDescriptor[] {
  return [
    { title: 'Flex layout', getPage: getFlexLayoutTest },
    { title: 'Responsive layout', getPage: getResponsiveLayoutDemo },
    { title: 'Panel menu', getPage: getPanelMenuTest },
    { title: 'Panel context', getPage: getPanelContextDemoScene },
    { title: 'Panel alternative time range selection', getPage: getPanelTimeRangeHandlerDemoScene },
    { title: 'Repeat layout by series', getPage: getPanelRepeaterTest },
    { title: 'Repeat layout by variable', getPage: getVariableRepeaterDemo },
    { title: 'Grid layout', getPage: getGridLayoutTest },
    { title: 'Grid with rows', getPage: getGridWithRowLayoutTest },
    { title: 'Lazy load', getPage: getLazyLoadDemo },
    { title: 'Variables', getPage: getVariablesDemo },
    { title: 'Adhoc filters', getPage: getAdhocFiltersDemo },
    { title: 'Group by (static)', getPage: getGroupByStatic },
    { title: 'Group by (datasource)', getPage: getGroupByDatasource },
    { title: 'With drilldowns', getPage: getDrilldownsAppPageScene },
    { title: 'Query editor', getPage: getQueryEditorDemo },
    { title: 'Dynamic page', getPage: getDynamicPageDemo },
    { title: 'Runtime panel plugin', getPage: getRuntimePanelPluginDemo },
    { title: 'Runtime data source plugin', getPage: getRuntimeDataSourceDemo },
    { title: 'Behaviors demo', getPage: getBehaviorsDemo },
    { title: 'Time zones demo', getPage: getTimeZoneTest },
    { title: 'Split layout', getPage: getSplitTest },
    { title: 'Query cancellation', getPage: getQueryCancellationTest },
    { title: 'Cursor sync', getPage: getCursorSyncTest },
    { title: 'Time range comparison', getPage: getTimeRangeComparisonTest },
    { title: 'Data layers', getPage: getAnnotationsDemo },
    { title: 'Dynamic data layers', getPage: getDynamicDataLayersDemo },
    { title: 'Transformations', getPage: getTransformationsTest },
    { title: 'Dynamic panel options and field config', getPage: getDynamicVizOptionsTest },
    { title: 'Data filtering', getPage: getDataFilteringTest },
    { title: 'Docs examples', getPage: getDocsExamples },
    { title: 'Nested scenes and variables', getPage: getNestedScenesAndVariablesDemo },
    { title: 'CSS Grid Layout', getPage: getCssGridLayoutDemo },
    { title: 'Panel header actions', getPage: getPanelHeaderActions },
    { title: 'Vertical controls layout', getPage: getVerticalControlsLayoutDemo },
    { title: 'Interactive table with expandable rows', getPage: getInteractiveTableDemo },
    { title: 'Query controller demo', getPage: getQueryControllerDemo },
  ].sort((a, b) => a.title.localeCompare(b.title));
}
