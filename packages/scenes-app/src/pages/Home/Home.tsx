import { SceneApp, SceneAppPage } from '@grafana/scenes';
import * as React from 'react';
import { getBasicScene } from './scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';

const getScene = () => {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Home page',
        subTitle:
          'This scene showcases a basic scene functionality, including query runner, variable and a custom scene object.',
        url: prefixRoute(ROUTES.Home),
        getScene: () => {
          return getBasicScene();
        },
      }),
    ],
  });
};
export const HomePage = () => {
  const scene = getScene();
  return <scene.Component model={scene} />;
};
