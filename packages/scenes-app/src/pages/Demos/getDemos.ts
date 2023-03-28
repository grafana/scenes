import { EmbeddedScene, SceneCanvasText, SceneFlexLayout } from '@grafana/scenes';
import { getPanelMenuTest } from './scenes/panelMenu';
import { getQueryEditorDemo } from './scenes/queryEditor';

interface SceneDef {
  title: string;
  getScene: () => EmbeddedScene;
}

export function getDemos(): SceneDef[] {
  return [
    { title: 'Panel menu', getScene: getPanelMenuTest },
    { title: 'Query editor demo', getScene: getQueryEditorDemo },
  ];
}

function getErrorScene(title: string) {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneCanvasText({
          text: `¯\\_(ツ)_/¯ No scene found with title ${title}`,
          align: 'center',
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
