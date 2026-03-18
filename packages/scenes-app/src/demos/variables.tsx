import { VariableRefresh } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneFlexItem,
  NestedScene,
  SceneAppPage,
  SceneAppPageState,
  behaviors,
  PanelBuilders,
  IntervalVariable,
  SceneTimePicker,
  VariableValueSelectors,
  SceneRefreshPicker,
  DataSourceVariable,
  SceneQueryRunner,
  TextBoxVariable,
  QueryVariable,
  CustomVariable,
  AdHocFiltersVariable,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVariablesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
    tabs: [
      new SceneAppPage({
        title: 'Async and chained',
        url: `${defaults.url}/query`,
        routePath: 'query',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new TestVariable({
                  name: 'server',
                  query: 'A.*',
                  value: 'server',
                  text: '',
                  description: 'Server name',
                  delayMs: 1000,
                  isMulti: true,
                  options: [],
                  refresh: VariableRefresh.onTimeRangeChanged,
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
                new CustomVariable({
                  name: 'keyValue',
                  description: 'CustomVariable with key value pairs',
                  value: '',
                  isMulti: true,
                  text: '',
                  query: 'A : 1, B : 2, C : 3',
                }),
                new IntervalVariable({
                  name: 'interval',
                  intervals: ['1d', '1m'],
                  autoEnabled: true,
                  autoStepCount: 30,
                  autoMinInterval: '10s',
                  description: 'Auto step count 30, auto min interval 10s',
                  refresh: VariableRefresh.onTimeRangeChanged,
                }),

                new QueryVariable({
                  name: 'queryVar',
                  label: 'QueryVariable with TestData datasource',
                  query: { query: '*', refId: 'A' },
                  datasource: { uid: 'gdev-testdata' },
                  definition: '*',
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              $behaviors: [getVariableChangeBehavior('keyValue'), getVariableChangeBehavior('server')],
              children: [
                getGraphAndTextPanel(),
                new SceneFlexItem({
                  body: new NestedScene({
                    title: 'Collapsable inner scene',
                    canCollapse: true,
                    body: getGraphAndTextPanel(),
                  }),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Data source and textbox',
        url: `${defaults.url}/ds`,
        routePath: 'ds',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new DataSourceVariable({
                  name: 'ds',
                  pluginId: 'grafana-testdata-datasource',
                }),
                new TextBoxVariable({
                  name: 'search',
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.timeseries()
                    .setTitle('datasource: $ds, search = $search')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: '$ds' },
                        queries: [
                          {
                            refId: 'A',
                            scenarioId: 'random_walk',
                            alias: 'ds = $ds, search = $search',
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Search filter',
        url: `${defaults.url}/search`,
        routePath: 'search',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new QueryVariable({
                  name: 'server',
                  query: { query: 'A.$__searchFilter', refId: 'A' },
                  datasource: { uid: 'gdev-testdata' },
                  definition: 'A.$__searchFilter',
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.text()
                    .setTitle('Variable with search filter')
                    .setOption(
                      'content',
                      'This is a very old messy feature that allows data sources to filter down the options in a query variable dropdown based on what the user has typed in. Only implemented by very few data sources (Graphite, SQL, Datadog)'
                    )
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Many variable options',
        url: `${defaults.url}/many-values`,
        routePath: 'many-values',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new TestVariable({
                  name: 'manyOptions',
                  query: '',
                  optionsToReturn: getRandomOptions(100000),
                  delayMs: 0,
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.text()
                    .setTitle('Description')
                    .setOption(
                      'content',
                      'This tab is mainly to test a variable with 100 000 options, to test search / typing performance. manyOptions=$manyOptions'
                    )
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Many adhoc variable values',
        url: `${defaults.url}/many-adhoc-values`,
        routePath: 'many-adhoc-values',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  name: 'manyAdhocOptions',
                  getTagKeysProvider: async () => ({
                    replace: true,
                    values: [
                      {
                        value: 'a',
                        text: 'A',
                      },
                      {
                        value: 'b',
                        text: 'B',
                      },
                      {
                        value: 'c',
                        text: 'C',
                      },
                    ],
                  }),
                  getTagValuesProvider: async () => {
                    return {
                      replace: true,
                      values: getRandomOptions(100000).map(({ value, label }) => ({
                        value,
                        text: label,
                      })),
                    };
                  },
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.text()
                    .setTitle('Description')
                    .setOption(
                      'content',
                      'This tab is mainly to test an adhoc variable with 100 000 options, to test search / typing performance. manyAdhocOptions=$manyAdhocOptions'
                    )
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
    ],
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
* interval: $interval
* keyValue: $keyValue
* keyValue: \${keyValue:text} (text value)
* queryVar: $queryVar
* [Link that updates pod = AAG and AAH](\${__url.path}\${__url.params:exclude:var-pod}&var-pod=AAG&var-pod=AAH)

          `
          )
          .build(),
      }),
    ],
  });
}

function getVariableChangeBehavior(variableName: string) {
  return new behaviors.ActWhenVariableChanged({
    variableName,
    onChange: (variable) => {
      console.log(`${variable.state.name} changed`);

      const t = setTimeout(() => {
        console.log(`${variable.state.name} post effect`);
      }, 5000);

      return () => {
        console.log(`${variable.state.name} cancel effect`);
        clearTimeout(t);
      };
    },
  });
}

function getRandomOptions(count: number) {
  return new Array(count).fill(null).map((_, index) => ({
    value: makeString(50),
    label: makeString(50),
  }));
}

function makeString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}
