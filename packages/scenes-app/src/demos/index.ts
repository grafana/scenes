import { SceneAppPage, SceneAppPageState } from '@grafana/scenes';
import { getDynamicPageDemo } from './dynamicPage';
import { getFlexLayoutTest } from './flexLayout';
import { getGridLayoutTest } from './grid';
import { getGridWithRowLayoutTest } from './gridWithRow';
import { getNestedScene } from './nestedScene';
import { getPanelContextDemoScene } from './panelContext';
import { getPanelMenuTest } from './panelMenu';
import { getPanelRepeaterTest } from './panelRepeater';
import { getQueryEditorDemo } from './queryEditor';
import { getVariablesDemo } from './variables';
import { getDrilldownsAppPageScene } from './withDrilldown/WithDrilldown';

export interface DemoDescriptor {
  title: string;
  getPage: (defaults: SceneAppPageState) => SceneAppPage;
}

export function getDemos(): DemoDescriptor[] {
  return [
    { title: 'Flex layout', getPage: getFlexLayoutTest },
    { title: 'Panel menu', getPage: getPanelMenuTest },
    { title: 'Panel context', getPage: getPanelContextDemoScene },
    { title: 'Repeat layout by series', getPage: getPanelRepeaterTest },
    { title: 'Grid layout', getPage: getGridLayoutTest },
    { title: 'Grid with rows', getPage: getGridWithRowLayoutTest },
    { title: 'Variables', getPage: getVariablesDemo },
    { title: 'Nested scene', getPage: getNestedScene },
    { title: 'With drilldowns', getPage: getDrilldownsAppPageScene },
    // getQueryEditorDemo(),
    // getDynamicPageDemo(),
  ];
}
