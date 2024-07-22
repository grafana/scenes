import {
  EmbeddedScene,
  PanelBuilders,
  QueryRunnerState,
  SceneAppPage,
  SceneAppPageState,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeCompare,
} from '@grafana/scenes';
import { SceneBaseliner, SceneChangepointDetector, SceneOutlierDetector } from '@grafana/scenes-ml';
import { DataQuery } from '@grafana/schema';
import { DATASOURCE_REF } from '../constants';

interface PredictableCSVWaveQuery extends DataQuery {
  timeStep?: number;
  valuesCSV?: string;
  name?: string;
}

// Data from https://www.kaggle.com/datasets/rakannimer/air-passengers.
const AIR_PASSENGERS = [
  112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118, 115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114,
  140, 145, 150, 178, 163, 172, 178, 199, 199, 184, 162, 146, 166, 171, 180, 193, 181, 183, 218, 230, 242, 209, 191,
  172, 194, 196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201, 204, 188, 235, 227, 234, 264, 302, 293, 259,
  229, 203, 229, 242, 233, 267, 269, 270, 315, 364, 347, 312, 274, 237, 278, 284, 277, 317, 313, 318, 374, 413, 405,
  355, 306, 271, 306, 315, 301, 356, 348, 355, 422, 465, 467, 404, 347, 305, 336, 340, 318, 362, 348, 363, 435, 491,
  505, 404, 359, 310, 337, 360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405, 417, 391, 419, 461, 472, 535,
  622, 606, 508, 461, 390, 432,
  // Add in a few changepoints to make things more interesting.
  10000, 10001, 10000.0, 10000.2,
].join(',');

// Data from https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/sep-2020.
const AUSTRALIAN_RESIDENTS = [
  13067.3, 13130.5, 13198.4, 13254.2, 13303.7, 13353.9, 13409.3, 13459.2, 13504.5, 13552.6, 13614.3, 13669.5, 13722.6,
  13772.1, 13832.0, 13862.6, 13893.0, 13926.8, 13968.9, 14004.7, 14033.1, 14066.0, 14110.1, 14155.6, 14192.2, 14231.7,
  14281.5, 14330.3, 14359.3, 14396.6, 14430.8, 14478.4, 14515.7, 14554.9, 14602.5, 14646.4, 14695.4, 14746.6, 14807.4,
  14874.4, 14923.3, 14988.7, 15054.1, 15121.7, 15184.2, 15239.3, 15288.9, 15346.2, 15393.5, 15439.0, 15483.5, 15531.5,
  15579.4, 15628.5, 15677.3, 15736.7, 15788.3, 15839.7, 15900.6, 15961.5, 16018.3, 16076.9, 16139.0, 16203.0, 16263.3,
  16327.9, 16398.9, 16478.3, 16538.2, 16621.6, 16697.0, 16777.2, 16833.1, 16891.6, 16956.8, 17026.3, 17085.4, 17106.9,
  17169.4, 17239.4, 17292.0, 17354.2, 17414.2, 17447.3, 17482.6, 17526.0, 17568.7, 17627.1, 17661.5,
].join(',');

const INDIA_TEMPERATURES = [
  10.0, 7.4, 7.166666666666667, 8.666666666666666, 6.0, 7.0, 7.0, 8.857142857142858, 14.0, 11.0, 15.714285714285714,
  14.0, 15.833333333333334, 12.833333333333334, 14.714285714285714, 13.833333333333334, 16.5, 13.833333333333334, 12.5,
  11.285714285714286, 11.2, 9.5, 14.0, 13.833333333333334, 12.25, 12.666666666666666, 12.857142857142858,
  14.833333333333334, 14.125, 14.714285714285714, 16.2, 16.0, 16.285714285714285, 18.0, 17.428571428571427, 16.625,
  16.666666666666668, 15.6, 14.0, 15.428571428571429, 15.25, 15.875, 15.333333333333334, 16.285714285714285,
  17.333333333333332, 19.166666666666668, 14.428571428571429, 13.666666666666666, 15.6, 15.857142857142858,
  17.714285714285715, 20.0, 20.5, 17.428571428571427, 16.857142857142858, 16.875, 17.857142857142858, 20.8,
  19.428571428571427,
].join(',');

const OUTLIER_DATA = [
  Array.from({ length: 100 }, () => Math.random() * 100),
  Array.from({ length: 100 }, () => Math.random() * 100),
  [
    ...Array.from({ length: 49 }, () => Math.random() * 100),
    ...Array.from({ length: 2 }, () => Math.random() * 1000),
    ...Array.from({ length: 49 }, () => Math.random() * 100),
  ],
];

function getOutlierQueryRunner() {
  return new SceneQueryRunner({
    queries: OUTLIER_DATA.map((values, i) => ({
      refId: String.fromCharCode(65 + i),
      datasource: DATASOURCE_REF,
      scenarioId: 'predictable_csv_wave',
      csvWave: [
        {
          timeStep: 600,
          valuesCSV: values.join(','),
        },
      ],
    })),
    maxDataPointsFromWidth: true,
  });
}

export function getQueryRunnerWithCSVWaveQuery(
  overrides?: Partial<PredictableCSVWaveQuery>,
  queryRunnerOverrides?: Partial<QueryRunnerState>
) {
  return new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'predictable_csv_wave',
        csvWave: [
          {
            timeStep: 600,
            valuesCSV: '0,0,0.5,1,2,2,1,1,0.5,0.3',
            ...overrides,
          },
        ],
      },
    ],
    ...queryRunnerOverrides,
  });
}

export function getMlDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time series demos',
    getScene: () => {
      return new EmbeddedScene({
        $data: getQueryRunnerWithCSVWaveQuery({}, { maxDataPointsFromWidth: false }),
        $timeRange: new SceneTimeRange({ from: 'now-48h', to: 'now' }),

        controls: [new SceneControlsSpacer(), new SceneTimePicker({}), new SceneTimeRangeCompare({ key: 'top' })],
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              wrap: 'wrap',
              children: [
                new SceneFlexItem({
                  minWidth: '100%',
                  minHeight: 300,
                  body: PanelBuilders.timeseries()
                    .setTitle('Outlier data')
                    .setData(getOutlierQueryRunner())
                    .setHeaderActions([
                      new SceneOutlierDetector({
                        sensitivity: 0.5,
                        // onOutlierDetected: console.log,
                      }),
                    ])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '100%',
                  minHeight: 300,
                  body: PanelBuilders.timeseries()
                    .setTitle('Simple wave')
                    .setData(getQueryRunnerWithCSVWaveQuery({}, { maxDataPointsFromWidth: true }))
                    .setHeaderActions([new SceneBaseliner({ interval: 0.95 })])
                    .build(),
                }),

                new SceneFlexItem({
                  minWidth: '100%',
                  minHeight: 300,
                  body: PanelBuilders.timeseries()
                    .setTitle('Spikey data with changepoints')
                    .setData(
                      getQueryRunnerWithCSVWaveQuery({ valuesCSV: AIR_PASSENGERS }, { maxDataPointsFromWidth: true })
                    )
                    .setHeaderActions([
                      new SceneBaseliner({}),
                      new SceneChangepointDetector({
                        enabled: true,
                        // onChangepointDetected: console.log,
                      }),
                    ])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '100%',
                  minHeight: 300,
                  body: PanelBuilders.timeseries()
                    .setTitle('Realistic repeated series')
                    .setData(
                      getQueryRunnerWithCSVWaveQuery(
                        { valuesCSV: INDIA_TEMPERATURES },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([
                      new SceneBaseliner({
                        interval: 0.95,
                      }),
                    ])
                    .build(),
                }),
                new SceneFlexItem({
                  minWidth: '100%',
                  minHeight: 300,
                  body: PanelBuilders.timeseries()
                    .setTitle('Sawtooth data')
                    .setData(
                      getQueryRunnerWithCSVWaveQuery(
                        { valuesCSV: AUSTRALIAN_RESIDENTS },
                        { maxDataPointsFromWidth: true }
                      )
                    )
                    .setHeaderActions([
                      new SceneBaseliner({
                        interval: 0.95,
                      }),
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
