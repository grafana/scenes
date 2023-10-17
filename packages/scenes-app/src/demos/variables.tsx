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
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVariablesDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Test of variable cascading updates and refresh on time range change',
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
    tabs: [
      new SceneAppPage({
        title: 'Async and chained',
        url: `${defaults.url}/query`,
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
                  delayMs: 1000,
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
                new TestVariable({
                  name: 'lonelyOne',
                  query: 'B.*',
                  value: '',
                  delayMs: 1000,
                  isMulti: true,
                  text: '',
                  options: [],
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
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              $behaviors: [getVariableChangeBehavior('lonelyOne'), getVariableChangeBehavior('server')],
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
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [
                new QueryVariable({
                  name: 'server',
                  query: { query: 'A.$__searchFilter', refId: 'A' },
                  datasource: { uid: 'gdev-testdata' },
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
