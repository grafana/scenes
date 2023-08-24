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
  const getTimeseriesPanelWithComparison = (refId: string) =>
    PanelBuilders.timeseries().setOverrides((b) =>
      b
        .matchComparisonQuery(refId)
        .overrideCustomFieldConfig('lineStyle', {
          fill: 'dash',
        })
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'gray',
        })
    );

  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time range comparison test',
    getScene: () => {
      return new EmbeddedScene({
        $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: false }),
        $timeRange: new SceneTimeRange({}),

        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneTimeRangeCompare({}),
          new SceneRefreshPicker({}),
        ],
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              wrap: 'wrap',
              children: [
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: getTimeseriesPanelWithComparison('A')
                    .setTitle('Uses global time range, data and comparer')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .build(),
                }),

                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: getTimeseriesPanelWithComparison('MyQuery')
                    .setTitle('Uses global time range and comparer, local data')
                    .setData(getQueryRunnerWithRandomWalkQuery({ refId: 'MyQuery' }, { maxDataPointsFromWidth: true }))
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: getTimeseriesPanelWithComparison('A')
                    .setTitle('Uses global time range, local comparer and data')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: getTimeseriesPanelWithComparison('A')
                    .setTitle('Uses local time range, data and comparer')
                    .setTimeRange(new SceneTimeRange({}))
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .setHeaderActions([
                      new SceneTimePicker({}),
                      new SceneTimeRangeCompare({}),
                      new SceneRefreshPicker({}),
                    ])
                    .build(),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
