import { EmbeddedScene, QueryEditor, SceneFlexItem, SceneFlexLayout, SceneTimeRange, VizPanel } from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getQueryEditorDemo(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: new VizPanel({
            pluginId: 'timeseries',
            title: 'Timeseries',
          }),
          minHeight: 200,
          minWidth: '40%',
        }),
        new SceneFlexItem({
          body: new QueryEditor(),
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
  });
}
