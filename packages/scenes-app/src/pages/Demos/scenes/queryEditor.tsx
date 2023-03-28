import { EmbeddedScene, QueryEditor, SceneFlexLayout, SceneTimeRange, VizPanel } from "@grafana/scenes";
import { getQueryRunnerWithRandomWalkQuery } from "../utils";

export function getQueryEditorDemo(): EmbeddedScene {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new VizPanel({
          pluginId: 'timeseries',
          title: 'Timeseries',
          placement: {
            minHeight: 200,
            minWidth: '40%',
          },
        }),
        new QueryEditor({
          datasource: 'gdev-testdata',
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
  });
}
