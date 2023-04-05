import {
  EmbeddedScene,
  SceneAppPage,
  SceneByFrameRepeater,
  SceneControlsSpacer,
  SceneDataNode,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneToolbarInput,
  VizPanel,
} from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getPanelRepeaterTest() {
  const queryRunner = getQueryRunnerWithRandomWalkQuery({
    seriesCount: 2,
    alias: '__server_names',
    scenarioId: 'random_walk',
  });

  return new SceneAppPage({
    title: 'Panel repeater',
    subTitle: 'Here we use the SceneByFrameRepeater to dynamically build a layout for each frame',
    url: `${demoUrl('panel-repeater')}`,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneByFrameRepeater({
          body: new SceneFlexLayout({
            direction: 'column',
            children: [],
          }),
          getLayoutChild: (data, frame, frameIndex) => {
            return new SceneFlexItem({
              minHeight: 200,
              body: new SceneFlexLayout({
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
                    body: new VizPanel({
                      pluginId: 'timeseries',
                      title: 'aaa',
                      options: {
                        legend: { displayMode: 'hidden' },
                      },
                    }),
                  }),
                  new SceneFlexItem({
                    width: 300,
                    body: new VizPanel({
                      pluginId: 'stat',
                      fieldConfig: { defaults: { displayName: 'Last' }, overrides: [] },
                      options: {
                        graphMode: 'none',
                      },
                    }),
                  }),
                ],
              }),
            });
          },
        }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        controls: [
          new SceneToolbarInput({
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
          new SceneRefreshPicker({ isOnCanvas: true }),
        ],
      });
    },
  });
}
