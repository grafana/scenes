import { AdHocVariableFilter, VariableRefresh } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneTimePicker,
  VariableValueSelectors,
  SceneRefreshPicker,
  SceneControlsSpacer,
  AdHocFiltersVariable,
} from '@grafana/scenes';
import { VariableHide } from '@grafana/schema';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVerticalControlsLayoutDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,

    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [
          new VariableValueSelectors({ layout: 'vertical' }),
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneRefreshPicker({}),
        ],
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'server',
              query: 'A.*',
              value: 'server',
              text: '',
              delayMs: 1000,
              options: [],
              refresh: VariableRefresh.onTimeRangeChanged,
              description: 'Server name',
            }),
            new TestVariable({
              name: 'pod',
              query: 'A.$server.*',
              value: 'pod',
              delayMs: 1000,
              isMulti: true,
              text: '',
              options: [],
            }),
            new TestVariable({
              name: 'handler',
              query: 'A.$server.$pod.*',
              value: 'pod',
              delayMs: 1000,
              isMulti: true,
              text: '',
              options: [],
              refresh: VariableRefresh.onTimeRangeChanged,
            }),
            new AdHocFiltersVariable({
              name: 'filters',
              hide: VariableHide.hideLabel,
              layout: 'vertical',
              applyMode: 'manual',
              filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
              getTagKeysProvider: async (variable: AdHocFiltersVariable, currentKey: string | null) => {
                await new Promise((resolve) => setTimeout(resolve, 200));
                return {
                  replace: true,
                  values: [{ text: 'job' }, { text: 'instance' }],
                };
              },
              getTagValuesProvider: async (variable: AdHocFiltersVariable, filter: AdHocVariableFilter) => {
                await new Promise((resolve) => setTimeout(resolve, 400));
                return {
                  replace: true,
                  values: ['A', 'B', 'C', 'D', 'E', 'F', 'grafana'].map((v) => ({ text: v })),
                };
              },
            }),
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [getGraphAndTextPanel()],
        }),
      });
    },
  });
}

function getGraphAndTextPanel() {
  return new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries()
          .setTitle('handler: $handler')
          .setData(
            getQueryRunnerWithRandomWalkQuery({
              alias: 'handler: $handler',
            })
          )
          .build(),
      }),
      new SceneFlexItem({
        body: PanelBuilders.text()
          .setTitle('Interpolation')
          .setOption(
            'content',
            `
* server: $server
* pod: $pod
* handler: $handler

          `
          )
          .build(),
      }),
    ],
  });
}
