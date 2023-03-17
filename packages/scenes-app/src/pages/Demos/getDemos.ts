import { EmbeddedScene } from '@grafana/scenes';
import { getPanelMenuTest } from './scenes/panelMenu';

interface SceneDef {
  title: string;
  getScene: () => EmbeddedScene;
}

export function getDemos(): SceneDef[] {
  return [{ title: 'Panel menu', getScene: getPanelMenuTest }];
}

const cache: Record<string, EmbeddedScene> = {};

export function getDemoByTitle(title: string) {
  if (cache[title]) {
    return cache[title];
  }

  const scene = getDemos().find((x) => x.title === title);

  if (scene) {
    cache[title] = scene.getScene();
  }

  return cache[title];
}
