import { EmbeddedScene, SceneCanvasText, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';
import { getFlexLayoutTest } from './scenes/flexLayout';
import { getGridLayoutTest } from './scenes/grid';
import { getGridWithRowLayoutTest } from './scenes/gridWithRow';
import { getLazyLoadDemo } from './scenes/lazyLoad';
import { getNestedScene } from './scenes/nestedScene';
import { getPanelContextDemoScene } from './scenes/panelContext';
import { getPanelMenuTest } from './scenes/panelMenu';
import { getPanelRepeaterTest } from './scenes/panelRepeater';
import { getVariablesDemo } from './scenes/variables';

interface SceneDef {
  title: string;
  getScene: () => EmbeddedScene;
}

export function getDemos(): SceneDef[] {
  return [
    { title: 'Panel menu', getScene: getPanelMenuTest },
    { title: 'Flex layout', getScene: getFlexLayoutTest },
    { title: 'Panel context', getScene: getPanelContextDemoScene },
    { title: 'Panel repeater', getScene: getPanelRepeaterTest },
    { title: 'Grid layout', getScene: getGridLayoutTest },
    { title: 'Grid layout with rows', getScene: getGridWithRowLayoutTest },
    { title: 'Nested scene', getScene: getNestedScene },
    { title: 'Variables', getScene: getVariablesDemo },
    { title: 'Lazy loading', getScene: getLazyLoadDemo },
  ];
}

function getErrorScene(title: string) {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: new SceneCanvasText({
            text: `¯\\_(ツ)_/¯ No scene found with title ${title}`,
            align: 'center',
          }),
        }),
      ],
    }),
  });
}

export function getDemoByTitle(title: string) {
  return (
    getDemos()
      .find((x) => x.title === title)
      ?.getScene() || getErrorScene(title)
  );
}
