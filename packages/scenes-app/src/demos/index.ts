import { SceneAppPage } from '@grafana/scenes';
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

export function getDemos(): SceneAppPage[] {
  return [
    getFlexLayoutTest(),
    getPanelMenuTest(),
    getPanelContextDemoScene(),
    getPanelRepeaterTest(),
    getGridLayoutTest(),
    getGridWithRowLayoutTest(),
    getVariablesDemo(),
    getNestedScene(),
    getDrilldownsAppPageScene(),
    getQueryEditorDemo(),
  ];
}
