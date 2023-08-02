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
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

function scopedComparison() {
  return new SceneAppPage({
    title: 'Scoped comparison test',
    url: demoUrl('time-range-comparison'),
    getScene: () => {
      return new EmbeddedScene({
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
                  body: PanelBuilders.timeseries()
                    .setTitle('Uses global time range and comparer, local data')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.timeseries()
                    .setTitle('Uses global time range, local comparer and data')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.timeseries()
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

function panelTests() {
  return new SceneAppPage({
    title: 'Panel support test',
    url: demoUrl('time-range-comparison/panels'),
    getScene: () => {
      return new EmbeddedScene({
        $timeRange: new SceneTimeRange({}),
        controls: [new SceneControlsSpacer(), new SceneTimePicker({}), new SceneRefreshPicker({})],
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
                  body: PanelBuilders.timeseries()
                    .setTitle('Time series panel')
                    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.barchart()
                    .setTitle('Bar chart')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        {
                          scenarioId: 'csv_metric_values',
                          stringInput: '1,20,90,30,5,0',
                        },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.statetimeline()
                    .setTitle('State timeline')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        {
                          scenarioId: 'csv_metric_values',
                          stringInput: '1,20,90,30,5,0',
                        },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.statushistory()
                    .setTitle('Status history')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        {
                          scenarioId: 'csv_metric_values',
                          stringInput: '1,20,90,30,5,0',
                        },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.table()
                    .setTitle('Table')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        {
                          scenarioId: 'csv_metric_values',
                          stringInput: '1,20,90,30,5,0',
                        },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([new SceneTimeRangeCompare({})])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '40%',
                  minHeight: 500,
                  body: PanelBuilders.heatmap()
                    .setTitle('Heatmap')
                    .setData(
                      getQueryRunnerWithRandomWalkQuery(
                        {
                          scenarioId: 'csv_metric_values',
                          stringInput: '1,20,90,30,5,0',
                        },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([new SceneTimeRangeCompare({})])
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
export function getTimeRangeComparisonTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time range comparison tests',
    url: demoUrl('time-range-comparison'),
    tabs: [scopedComparison(), panelTests()],
  });
}
