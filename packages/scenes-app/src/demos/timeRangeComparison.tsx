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
  SceneTimeRangeComparePicker,
  SceneTimeRangeWithComparison,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getTimeRangeComparisonTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time range comparison test',
    getScene: () => {
      return new EmbeddedScene({
        $timeRange: new SceneTimeRangeWithComparison({
          $timeRange: new SceneTimeRange({}),
        }),
        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneTimeRangeComparePicker({}),
          new SceneRefreshPicker({}),
        ],
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.timeseries()
                    .setTitle('Should run two queries when compare option provided')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .build(),
                }),
                // new SceneFlexLayout({
                //   direction: 'column',
                //   children: [
                //     new SceneFlexItem({
                //       ySizing: 'content',
                //       body: new SceneCanvasText({
                //         text: 'Panel below uses local compare options, reading from the global time range',
                //       }),
                //     }),
                //     new SceneFlexItem({
                //       body: new SceneFlexLayout({
                //         direction: 'row',
                //         $timeRange: new SceneTimeRangeWithComparison({}),
                //         children: [
                //           new SceneFlexItem({
                //             body: PanelBuilders.timeseries()
                //               .setTitle('Dynamic height and width')
                //               .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                //               .build(),
                //           }),
                //           new SceneFlexItem({
                //             body: new SceneTimeRangeComparePicker({}),
                //             xSizing: 'content',
                //             ySizing: 'content',
                //           }),
                //         ],
                //       }),
                //     }),
                //   ],
                // }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
