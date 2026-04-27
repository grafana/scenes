import {
  AdHocFiltersVariable,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneVariableSet,
  ScopesVariable,
  VariableValueSelectors,
  VizPanel,
} from '@grafana/scenes';
import { EmbeddedSceneWithContext } from '@grafana/scenes-react';
import { getEmbeddedSceneDefaults, getPromQueryInstant } from './utils';

SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = true;

export function getScopesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedSceneWithContext({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [new ScopesVariable({ enable: true }), new AdHocFiltersVariable({ layout: 'combobox' })],
        }),
        key: 'Prometheus query that uses scopes',
        controls: [new VariableValueSelectors({})],
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
            new SceneFlexItem({
              body: PanelBuilders.text()
                .setTitle('Text panel with scopes')
                .setOption(
                  'content',
                  `\`__scopes\`:  $__scopes
                  \`__scopes:queryparam\`: \${__scopes:queryparam}
                  `
                )
                .build(),
            }),
          ],
        }),
      });
    },
  });
}
