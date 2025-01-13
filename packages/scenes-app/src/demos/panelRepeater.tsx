import { getFrameDisplayName } from '@grafana/data';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneByFrameRepeater,
  SceneDataNode,
  SceneFlexItem,
  SceneFlexLayout,
  SceneToolbarInput,
} from '@grafana/scenes';
import { BigValueGraphMode } from '@grafana/schema';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getPanelRepeaterTest(defaults: SceneAppPageState) {
  const queryRunner = getQueryRunnerWithRandomWalkQuery({
    seriesCount: 2,
    alias: '__server_names',
    scenarioId: 'random_walk',
  });

  return new SceneAppPage({
    ...defaults,
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
                    body: PanelBuilders.timeseries()
                      .setTitle(getFrameDisplayName(frame, frameIndex))
                      .setOption('legend', { showLegend: false })
                      .build(),
                  }),
                  new SceneFlexItem({
                    width: 300,
                    body: PanelBuilders.stat()
                      .setDisplayName('Last')
                      .setOption('graphMode', BigValueGraphMode.None)
                      .build(),
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
            label: 'Series count',
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
