import { EmbeddedScene, SceneAppPage, SceneAppPageState } from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from '../utils';
import { CustomObjectWithReactContext } from './CustomObjectWithReactContext';

export function getReactContext(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Example of custom object that is consuming a React Context',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new CustomObjectWithReactContext(),
      });
    },
  });
}
