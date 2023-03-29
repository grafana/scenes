import { SceneApp, SceneAppPage } from '@grafana/scenes';
import * as React from 'react';
import { getBasicScene } from './scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { DATASOURCE_REF, ROUTES } from '../../constants';
import { config } from '@grafana/runtime';
import { Alert } from '@grafana/ui';

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

  return <>
    {!config.featureToggles.topnav && <Alert title='Missing topnav feature toggle'>
      Scenes are designed to work with the new navigation wrapper that will be standard in grafana 10
    </Alert>}

    {!config.datasources[DATASOURCE_REF.uid] && <Alert title={`Missing ${DATASOURCE_REF.uid} datasource`}>
      These demos depend on <b>testdata</b> datasource: <code>{JSON.stringify(DATASOURCE_REF)}</code>.  
      This can be provisioned using the attached datasource provisioning files.
    </Alert>}

    <scene.Component model={scene} />
  </>;
};
