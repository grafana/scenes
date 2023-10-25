import { SceneAppPage, SceneAppPageState } from '@grafana/scenes';
import { getRuntimePanelPluginDemo } from './runtimePanelPlugin';
import { getBehaviorsDemo } from './behaviors/behaviorsDemo';
import { getDynamicPageDemo } from './dynamicPage';
import { getFlexLayoutTest } from './flexLayout';
import { getGridLayoutTest } from './grid';
import { getGridWithRowLayoutTest } from './gridWithRow';
import { getLazyLoadDemo } from './lazyLoad';
import { getNestedScene } from './nestedScene';
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
import { getTransformationsTest } from './transformations';
import { getDynamicVizOptionsTest } from './dynamicPanelOptions';
import { getDataFilteringTest } from './filteringData';
import { getCssGridLayoutDemo } from './cssGridLayoutDemo';
import { getPanelHeaderActions } from './panelHeaderActions';

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
    { title: 'Repeat layout by series', getPage: getPanelRepeaterTest },
    { title: 'Grid layout', getPage: getGridLayoutTest },
    { title: 'Grid with rows', getPage: getGridWithRowLayoutTest },
    { title: 'Lazy load', getPage: getLazyLoadDemo },
    { title: 'Variables', getPage: getVariablesDemo },
    { title: 'Adhoc filters', getPage: getAdhocFiltersDemo },
    { title: 'Nested scene', getPage: getNestedScene },
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
    { title: 'Transformations', getPage: getTransformationsTest },
    { title: 'Dynamic panel options and field config', getPage: getDynamicVizOptionsTest },
    { title: 'Data filtering', getPage: getDataFilteringTest },
    { title: 'Docs examples', getPage: getDocsExamples },
    { title: 'CSS Grid Layout', getPage: getCssGridLayoutDemo },
    { title: 'Panel header actions', getPage: getPanelHeaderActions },
  ].sort((a, b) => a.title.localeCompare(b.title));
}
