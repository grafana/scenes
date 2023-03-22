import { EmbeddedScene, SceneCanvasText, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';
import { getFlexLayoutTest } from './scenes/flexLayout';
import { getPanelMenuTest } from './scenes/panelMenu';
import { getPanelRepeaterTest } from './scenes/panelRepeater';

interface SceneDef {
  title: string;
  getScene: () => EmbeddedScene;
}

export function getDemos(): SceneDef[] {
  return [
    { title: 'Panel menu', getScene: getPanelMenuTest },
    { title: 'Flex layout', getScene: getFlexLayoutTest },
    { title: 'Panel repeater', getScene: getPanelRepeaterTest },
  ];
}

function getErrorScene(title: string) {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          children: [
            new SceneCanvasText({
              text: `¯\\_(ツ)_/¯ No scene found with title ${title}`,
              align: 'center',
            }),
          ],
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
