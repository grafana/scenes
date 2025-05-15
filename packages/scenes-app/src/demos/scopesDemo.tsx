import {
  AdHocFiltersVariable,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  SceneVariableSet,
  ScopesVariable,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getPromQueryInstant } from './utils';
import { EmbeddedSceneWithContext } from '@grafana/scenes-react';

export function getScopesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    $variables: new SceneVariableSet({
      variables: [new ScopesVariable({ enable: true }), new AdHocFiltersVariable({ layout: 'combobox' })],
    }),
    getScene: () => {
      return new EmbeddedSceneWithContext({
        ...getEmbeddedSceneDefaults(),

        key: 'Prometheus query that uses scopes',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                title: 'ALERTS',
                pluginId: 'table',
                $data: getPromQueryInstant({ expr: 'ALERTS', format: 'table' }),
              }),
            }),
          ],
        }),
      });
    },
  });
}
