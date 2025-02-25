import React, { useMemo } from 'react';
import { EmbeddedScene, SceneApp, SceneAppPage, SceneReactObject } from '@grafana/scenes';

const Simple = () => {
  return <div>3232233223</div>
}

const PluginSceneApp = () => {

  const scene = useMemo(() => {
    return new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Page 1',
          hideFromBreadcrumbs: false,
          url: '/a/grafana-scenes-app/plugin-scene-app-1/overview',
          routePath: '*', // * - will handle Page 1 and Page 2 as Page 1. 'plugin-scene-app-1' will not show anything on the pages
          tabs: [
            new SceneAppPage({
              title: 'Overview',
              url: '/a/grafana-scenes-app/plugin-scene-app-1/overview',
              routePath: 'overview',
              getScene: () => new EmbeddedScene({
                body: new SceneReactObject({
                  component: Simple,
                }),
              }),
            }),
            new SceneAppPage({
              title: 'Y',
              url: '/a/grafana-scenes-app/plugin-scene-app-1/y',
              routePath: 'y',
              getScene: () => new EmbeddedScene({
                body: new SceneReactObject({
                  component: Simple,
                }),
              }),
            }),
          ],
        }),
        new SceneAppPage({
          title: 'Page 2',
          hideFromBreadcrumbs: false,
          url: '/a/grafana-scenes-app/plugin-scene-app-2',
          routePath: 'plugin-scene-app-2/overview',
          tabs: [
            new SceneAppPage({
              title: 'Overview',
              url: '/a/grafana-scenes-app/plugin-scene-app-2/overview',
              routePath: 'overview',
              getScene: () => new EmbeddedScene({
                body: new SceneReactObject({
                  component: Simple,
                }),
              }),
            }),
            new SceneAppPage({
              title: 'Y',
              url: '/a/grafana-scenes-app/plugin-scene-app-2/y',
              routePath: 'y',
              getScene: () => new EmbeddedScene({
                body: new SceneReactObject({
                  component: Simple,
                }),
              }),
            }),
          ],
        }),
      ],
    });
  }, []);

  return (
    <div>
      <scene.Component model={scene} />
    </div>
  );
};

export default PluginSceneApp;
