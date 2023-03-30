import { EmbeddedScene, QueryEditor, SceneFlexItem, SceneFlexLayout, SceneTimeRange, VizPanel } from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getQueryEditorDemo(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: new QueryEditor(),
        }),
        new SceneFlexItem({
          body: new VizPanel({
            pluginId: 'timeseries',
            title: 'Timeseries',
          }),
          minHeight: 400,
          minWidth: '40%',
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
  });
}
