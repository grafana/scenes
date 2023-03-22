import {
  EmbeddedScene,
  SceneByFrameRepeater,
  SceneControlsSpacer,
  SceneDataNode,
  SceneFlexItem,
  SceneFlexLayout,
  SceneTimePicker,
  SceneTimeRange,
  SceneToolbarInput,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getPanelRepeaterTest(): EmbeddedScene {
  const queryRunner = getQueryRunnerWithRandomWalkQuery({
    seriesCount: 2,
    alias: '__server_names',
    scenarioId: 'random_walk',
  });

  return new EmbeddedScene({
    body: new SceneByFrameRepeater({
      body: new SceneFlexLayout({
        direction: 'column',
        children: [],
      }),
      getLayoutChild: (data, frame, frameIndex) => {
        return new SceneFlexItem({
          minHeight: 200,
          flexGrow: 1,
          children: [
            new SceneFlexLayout({
              direction: 'row',
              key: `panel-${frameIndex}`,
              $data: new SceneDataNode({
                data: {
                  ...data,
                  series: [frame],
                },
              }),
              children: [
                new SceneFlexItem({
                  flexGrow: 1,
                  children: [
                    new VizPanel({
                      pluginId: 'timeseries',
                      title: 'aaa',
                      options: {
                        legend: { displayMode: 'hidden' },
                      },
                    }),
                  ],
                }),
                new SceneFlexItem({
                  width: 300,
                  children: [
                    new VizPanel({
                      pluginId: 'stat',
                      fieldConfig: { defaults: { displayName: 'Last' }, overrides: [] },
                      options: {
                        graphMode: 'none',
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      },
    }),
    $timeRange: new SceneTimeRange(),
    $data: queryRunner,
    controls: [
      new SceneToolbarInput({
        label: 'Series count',
        value: '2',
        onChange: (newValue) => {
          queryRunner.setState({
            queries: [
              {
                ...queryRunner.state.queries[0],
                seriesCount: newValue,
              },
            ],
          });
          queryRunner.runQueries();
        },
      }),
      new SceneControlsSpacer(),
      new SceneTimePicker({ isOnCanvas: true }),
    ],
  });
}
