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
              includeAll: true,
              valuesFormat: 'json',
              query: `
[
  { "value": "1", "text": "Development",  "aws_environment": "development", "azure_environment": "dev" },
  { "value": "2", "text": "Staging",      "aws_environment": "staging",     "azure_environment": "stg" },
  { "value": "3", "text": "Production",   "aws_environment": "prod",        "azure_environment": "prd" }
]
`,
            }),
          ],
        }),
        body: new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              body: PanelBuilders.text()
                .setTitle('Environment')
                .setOption(
                  'content',
                  `
- Current value = \${envs}
- Value formatter = \${envs:value}
- Text formatter = \${envs:text}
`
                )
                .build(),
            }),
            new SceneFlexItem({
              body: PanelBuilders.text()
                .setTitle('AWS environment')
                .setOption(
                  'content',
                  `
- Current value = \${envs.aws_environment}
- Value formatter = \${envs.aws_environment:value}
- Text formatter = \${envs.aws_environment:text}
`
                )
                .build(),
            }),
            new SceneFlexItem({
              body: PanelBuilders.text()
                .setTitle('Azure environment')
                .setOption(
                  'content',
                  `
- Current value = \${envs.azure_environment}
- Value formatter = \${envs.azure_environment:value}
- Text formatter = \${envs.azure_environment:text}
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
