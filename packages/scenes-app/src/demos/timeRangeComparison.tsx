import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeCompare,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getTimeRangeComparisonTest(defaults: SceneAppPageState) {
  const panels: SceneFlexItem[] = [];

  for (let i = 0; i < 390; i++) {
    panels.push(
      new SceneFlexItem({
        minWidth: '40%',
        minHeight: 500,
        body: PanelBuilders.timeseries()
          .setTitle('Uses global time range, data and comparer')
          .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
          .setHeaderActions([new SceneTimeRangeCompare({ key: 'mid' })])
          .build(),
      })
    );
  }

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: false }),
        $timeRange: new SceneTimeRange({}),

        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          // new SceneTimeRangeCompare({ key: 'top' }),
          new SceneRefreshPicker({}),
        ],
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              wrap: 'wrap',
              children: [...panels],
            }),
          ],
        }),
      });
    },
  });
}
