import {
  CustomVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getVariableWithObjectValuesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [new VariableValueSelectors({})],
        $variables: new SceneVariableSet({
          variables: [
            new CustomVariable({
              name: 'envs',
              label: 'Environments',
              isMulti: true,
              value: '',
              text: '',
              optionsProviderType: 'json',
              query: `
[
  { "id": 1, "name": "Development", "aws_environment": "development", "azure_environment": "dev" },
  { "id": 2, "name": "Staging", "aws_environment": "staging", "azure_environment": "stg" },
  { "id": 3, "name": "Production", "aws_environment": "prod", "azure_environment": "prd" }
]
`,
              valueProp: 'id',
              textProp: 'name',
            }),
          ],
        }),
        body: new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              body: PanelBuilders.text().setTitle('AWS').setOption('content', '${envs.aws_environment}').build(),
            }),
            new SceneFlexItem({
              body: PanelBuilders.text().setTitle('Azure').setOption('content', '${envs.azure_environment}').build(),
            }),
          ],
        }),
      });
    },
  });
}
