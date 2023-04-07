import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneByFrameRepeater,
  SceneDataNode,
  SceneFlexItem,
  SceneFlexLayout,
  SceneToolbarInput,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getPanelRepeaterTest(defaults: SceneAppPageState) {
  const queryRunner = getQueryRunnerWithRandomWalkQuery({
    seriesCount: 2,
    alias: '__server_names',
    scenarioId: 'random_walk',
  });

  return new SceneAppPage({
    ...defaults,
    subTitle: 'Here we use the SceneByFrameRepeater to dynamically build a layout for each frame',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
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
          ...getEmbeddedSceneDefaults().controls,
        ],
      });
    },
  });
}
