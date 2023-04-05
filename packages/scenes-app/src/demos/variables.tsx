import { VariableRefresh } from '@grafana/data';
import {
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  VariableValueSelectors,
  SceneVariableSet,
  TestVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneRefreshPicker,
  SceneFlexItem,
  VizPanel,
  SceneCanvasText,
  NestedScene,
  SceneAppPage,
} from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getVariablesDemo() {
  return new SceneAppPage({
    title: 'Variables demo',
    subTitle: 'Test of variable cascading updates and refresh on time range change',
    url: `${demoUrl('variables')}`,
    getScene: () => {
      return new EmbeddedScene({
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
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: new SceneFlexLayout({
                direction: 'column',
                children: [
                  new SceneFlexItem({
                    body: new SceneFlexLayout({
                      children: [
                        new SceneFlexItem({
                          body: new VizPanel({
                            pluginId: 'timeseries',
                            title: 'handler: $handler',
                            $data: getQueryRunnerWithRandomWalkQuery({
                              alias: 'handler: $handler',
                            }),
                          }),
                        }),
                        new SceneFlexItem({
                          body: new SceneCanvasText({
                            text: 'Text: ${textbox}',
                            fontSize: 20,
                            align: 'center',
                          }),
                        }),
                        new SceneFlexItem({
                          width: '40%',
                          body: new SceneCanvasText({
                            text: 'server: ${server} pod:${pod}',
                            fontSize: 20,
                            align: 'center',
                          }),
                        }),
                      ],
                    }),
                  }),
                  new SceneFlexItem({
                    body: new NestedScene({
                      title: 'Collapsable inner scene',
                      canCollapse: true,
                      body: new SceneFlexLayout({
                        direction: 'row',
                        children: [
                          new SceneFlexItem({
                            body: new VizPanel({
                              pluginId: 'timeseries',
                              title: 'handler: $handler',
                              $data: getQueryRunnerWithRandomWalkQuery({
                                alias: 'handler: $handler',
                              }),
                            }),
                          }),
                        ],
                      }),
                    }),
                  }),
                ],
              }),
            }),
          ],
        }),
        $timeRange: new SceneTimeRange(),
        controls: [
          new VariableValueSelectors({}),
          new SceneControlsSpacer(),
          new SceneTimePicker({ isOnCanvas: true }),
          new SceneRefreshPicker({ isOnCanvas: true }),
        ],
      });
    },
  });
}
