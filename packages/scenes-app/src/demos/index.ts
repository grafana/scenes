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
import { getTimeCompareManyPanels } from './timeCompareManyPanels';
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
import { getInteropDemo } from './interopDemo';
import { getUrlSyncTest } from './urlSyncTest';
import { getMlDemo } from './ml';
import { getSceneGraphEventsDemo } from './sceneGraphEvents';
import { getSeriesLimitTest } from './seriesLimit';
import { getScopesDemo } from './scopesDemo';
import { getVariableWithObjectValuesDemo } from './variableWithObjectValuesDemo';
import { getPanelRepeaterByProcessorDemo } from './panelRepeaterByProcessor';

export interface DemoDescriptor {
  title: string;
  description: string;
  getPage: (defaults: SceneAppPageState) => SceneAppPage;
  getSourceCodeModule: () => Promise<any>;
}

export function getDemos(): DemoDescriptor[] {
  return [
    {
      title: 'Flex layout',
      description: 'A simple demo of different flex layout options',
      getPage: getFlexLayoutTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/flexLayout'),
    },
    {
      title: 'Responsive layout',
      description: 'Show casing the default and custom responsive options of SceneFlexLayout',
      getPage: getResponsiveLayoutDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/responsiveLayout'),
    },
    {
      title: 'Panel menu',
      description: 'Different ways to use panel menu',
      getPage: getPanelMenuTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/panelMenu'),
    },
    {
      title: 'Panel context',
      description: 'Here you can test changing series color and toggle series visiblity.',
      getPage: getPanelContextDemoScene,
      getSourceCodeModule: () => import('!!raw-loader!../demos/panelContext'),
    },
    {
      title: 'Repeat layout by series',
      description: 'Here we use the SceneByFrameRepeater to dynamically build a layout for each frame',
      getPage: getPanelRepeaterTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/panelRepeater'),
    },
    {
      title: 'Repeat layout by series (using data processor)',
      description: 'Here we use repeat a panel using a data processor',
      getPage: getPanelRepeaterByProcessorDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/panelRepeaterByProcessor'),
    },
    {
      title: 'Repeat layout by variable',
      description: 'Test of repeating layout by variable',
      getPage: getVariableRepeaterDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/variableRepeater'),
    },
    {
      title: 'Grid layout',
      description: 'Demo of the SceneGridLayout',
      getPage: getGridLayoutTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/grid'),
    },
    {
      title: 'Grid with rows',
      description: 'SceneGridLayout demo with collapsible rows',
      getPage: getGridWithRowLayoutTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/gridWithRow'),
    },
    {
      title: 'Lazy load',
      description: 'Showcasing lazy rendering and query execution of panels that are outside viewport',
      getPage: getLazyLoadDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/lazyLoad'),
    },
    {
      title: 'Variables',
      description: 'Test of variable cascading updates and refresh on time range change',
      getPage: getVariablesDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/variables'),
    },
    {
      title: 'Adhoc filters',
      description: `Adhoc filters variable can be used in auto mode. By default datasources will apply the filters automatically to all queries of the same data source. In manual mode you can use it as a normal variable in queries or use it programmtically.`,
      getPage: getAdhocFiltersDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/adhocFiltersDemo'),
    },
    {
      title: 'Group by (static)',
      description: 'TODO Group by (static)',
      getPage: getGroupByStatic,
      getSourceCodeModule: () => import('!!raw-loader!../demos/groupByStatic'),
    },
    {
      title: 'Group by (datasource)',
      description: 'TODO Group by (datasource)',
      getPage: getGroupByDatasource,
      getSourceCodeModule: () => import('!!raw-loader!../demos/groupByDatasource'),
    },
    {
      title: 'With drilldowns',
      description:
        'This scene showcases a basic drilldown functionality. Interact with room to see room details scene.',
      getPage: getDrilldownsAppPageScene,
      getSourceCodeModule: () => import('!!raw-loader!../demos/withDrilldown/WithDrilldown'),
    },
    {
      title: 'Query editor',
      description: 'Example of how to to build a component that uses the QueryEditor',
      getPage: getQueryEditorDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/queryEditor'),
    },
    {
      title: 'Dynamic page',
      description: 'Dynamic tabs, and drilldowns. Adds a tab with drilldown after 2 seconds.',
      getPage: getDynamicPageDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/dynamicPage'),
    },
    {
      title: 'Runtime panel plugin',
      description: 'Demo of a runtime registered panel plugin',
      getPage: getRuntimePanelPluginDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/runtimePanelPlugin'),
    },
    {
      title: 'Runtime data source plugin',
      description: 'Demo of a runtime registered panel plugin',
      getPage: getRuntimeDataSourceDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/runtimeDataSourceDemo'),
    },
    {
      title: 'Behaviors demo',
      description: 'Behaviors can augment any scene object with new runtime behaviors and state logic',
      getPage: getBehaviorsDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/behaviors/behaviorsDemo'),
    },
    {
      title: 'Time zones demo',
      description: 'Time zones support test',
      getPage: getTimeZoneTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/timeZones'),
    },
    {
      title: 'Split layout',
      description: 'A demo of split layout options',
      getPage: getSplitTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/split'),
    },
    {
      title: 'Query cancellation',
      description: 'Demo of query cancellation',
      getPage: getQueryCancellationTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/queryCancellation'),
    },
    {
      title: 'Cursor sync',
      description: 'A simple demo of scoped cursor sync',
      getPage: getCursorSyncTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/cursorSync'),
    },
    {
      title: 'Time range comparison',
      description: 'Time range comparison test',
      getPage: getTimeRangeComparisonTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/timeRangeComparison'),
    },
    {
      title: 'Time range compare many panels',
      description: 'Performance test with per panel time compare and many panels ',
      getPage: getTimeCompareManyPanels,
      getSourceCodeModule: () => import('!!raw-loader!../demos/timeCompareManyPanels'),
    },
    {
      title: 'Data layers',
      description: 'A simple demo of different flex layout options',
      getPage: getAnnotationsDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/annotations'),
    },
    {
      title: 'Dynamic data layers',
      description: 'A demo of data layers added and removed dynamically',
      getPage: getDynamicDataLayersDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/dynamicDataLayers'),
    },
    {
      title: 'Transformations',
      description: 'Transformations support',
      getPage: getTransformationsTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/transformations'),
    },
    {
      title: 'Dynamic panel options and field config',
      description: 'A panel with actions that change visualization settings',
      getPage: getDynamicVizOptionsTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/dynamicPanelOptions'),
    },
    {
      title: 'Data filtering',
      description: 'Demo showing a simple data filtering case',
      getPage: getDataFilteringTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/filteringData'),
    },
    {
      title: 'Docs examples',
      description: 'Examples from documentation page',
      getPage: getDocsExamples,
      getSourceCodeModule: () => import('!!raw-loader!../demos/docs-examples'),
    },
    {
      title: 'Nested scenes and variables',
      description: 'Shows variables that depend on other variables defined on a higher level',
      getPage: getNestedScenesAndVariablesDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/nestedVariables'),
    },
    {
      title: 'CSS Grid Layout',
      description:
        'A CSS Grid Layout demo, isLazy is enabled to showcase lazy rendering of panels. Every 3rd panel is hidden to test the layout working properly.',
      getPage: getCssGridLayoutDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/cssGridLayoutDemo'),
    },
    {
      title: 'Panel header actions',
      description: 'Example of panels with actions and controls',
      getPage: getPanelHeaderActions,
      getSourceCodeModule: () => import('!!raw-loader!../demos/panelHeaderActions'),
    },
    {
      title: 'Vertical controls layout',
      description: 'Test of variables and adhoc filters with vertical layout',
      getPage: getVerticalControlsLayoutDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/verticalControlsLayoutDemo'),
    },
    {
      title: 'Interactive table with expandable rows',
      description: 'Interactive table',
      getPage: getInteractiveTableDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/interactiveTableDemo'),
    },
    {
      title: 'Query controller demo',
      description: 'Shows how to see query state of a sub scene and cancel all sub scene queries',
      getPage: getQueryControllerDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/queryController'),
    },
    {
      title: 'Interop with hooks and context',
      description: 'Testing using the hooks and plain react components from normal scene',
      getPage: getInteropDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/interopDemo'),
    },
    {
      title: 'Url sync test',
      description: 'A simple demo stress testing url sync',
      getPage: getUrlSyncTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/urlSyncTest'),
    },
    {
      title: 'Machine Learning',
      description: 'Time series Machine Learning demos',
      getPage: getMlDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/ml'),
    },
    {
      title: 'Events on the Scene Graph',
      description: 'Illustrating how events traverse the scene graph',
      getPage: getSceneGraphEventsDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/sceneGraphEvents'),
    },
    {
      title: 'Series limit',
      description: 'Test panel series limit feature',
      getPage: getSeriesLimitTest,
      getSourceCodeModule: () => import('!!raw-loader!../demos/seriesLimit'),
    },
    {
      title: 'Scopes demo',
      description: 'Test scopes',
      getPage: getScopesDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/scopesDemo'),
    },
    {
      title: 'Variables with object values',
      description: '',
      getPage: getVariableWithObjectValuesDemo,
      getSourceCodeModule: () => import('!!raw-loader!../demos/variableWithObjectValuesDemo.tsx'),
    },
  ].sort((a, b) => a.title.localeCompare(b.title));
}
