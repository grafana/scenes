import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  SceneDataNode,
  SceneQueryRunner,
  SceneToolbarInput,
  VizPanel,
  sceneGraph,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';
import { DATASOURCE_REF } from '../constants';
import { LoadingState, PanelData, getFrameDisplayName } from '@grafana/data';

export function getPanelRepeaterByProcessorDemo(defaults: SceneAppPageState) {
  const queryRunner = new SceneQueryRunner({
    dataProcessor: repeater,
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk',
        seriesCount: 4,
        alias: '__server_names',
      },
    ],
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneCSSGridLayout({
          children: [
            PanelBuilders.timeseries()
              .setTitle('Panel')
              .setOption('legend', { showLegend: false })
              .setData(queryRunner)
              .build(),
          ],
        }),
        controls: [
          new SceneToolbarInput({
            value: '4',
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

function repeater(queryRunner: SceneQueryRunner, data: PanelData) {
  const layout = sceneGraph.getAncestor(queryRunner, SceneCSSGridLayout);
  const sourcePanel = queryRunner.parent as VizPanel;
  const children: VizPanel[] = [sourcePanel];
  let returnData = data;

  if (data.state === LoadingState.Loading) {
    return returnData;
  }

  for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
    if (seriesIndex === 0) {
      sourcePanel.setState({ title: getFrameDisplayName(data.series[seriesIndex], seriesIndex) });
      returnData = { ...data, series: [data.series[seriesIndex]] };
      continue;
    }

    const clone = sourcePanel.clone({
      title: getFrameDisplayName(data.series[seriesIndex], seriesIndex),
      $data: new SceneDataNode({
        data: {
          ...data,
          series: [data.series[seriesIndex]],
        },
      }),
    });

    children.push(clone);
  }

  layout.setState({ children });
  return returnData;
}
