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
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeCompare,
} from '@grafana/scenes';
import { SceneChangepointDetector } from '@grafana/scenes-ml';
import { DataQuery } from '@grafana/schema';
import { DATASOURCE_REF } from '../constants';

interface PredictableCSVWaveQuery extends DataQuery {
  timeStep?: number;
  valuesCSV?: string;
  name?: string;
}

// Data from https://www.kaggle.com/datasets/rakannimer/air-passengers.
const AIR_PASSENGERS = [
  112., 118., 132., 129., 121., 135., 148., 148., 136., 119., 104., 118., 115., 126., 141., 135.,
  125., 149., 170., 170., 158., 133., 114., 140., 145., 150., 178., 163., 172., 178., 199., 199.,
  184., 162., 146., 166., 171., 180., 193., 181., 183., 218., 230., 242., 209., 191., 172., 194.,
  196., 196., 236., 235., 229., 243., 264., 272., 237., 211., 180., 201., 204., 188., 235., 227.,
  234., 264., 302., 293., 259., 229., 203., 229., 242., 233., 267., 269., 270., 315., 364., 347.,
  312., 274., 237., 278., 284., 277., 317., 313., 318., 374., 413., 405., 355., 306., 271., 306.,
  315., 301., 356., 348., 355., 422., 465., 467., 404., 347., 305., 336., 340., 318., 362., 348.,
  363., 435., 491., 505., 404., 359., 310., 337., 360., 342., 406., 396., 420., 472., 548., 559.,
  463., 407., 362., 405., 417., 391., 419., 461., 472., 535., 622., 606., 508., 461., 390., 432.,
  // Add in a few changepoints to make things more interesting.
  10000., 10001., 10000.0, 10000.2,
].join(',');

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
        csvWave: [{
          timeStep: 60,
          valuesCSV: "0,0,0.5,1,2,2,1,1,0.5,0.3",
          ...overrides,
        }],
      },
    ],
    ...queryRunnerOverrides,
  });
}

export function getChangepointsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time range baselining test',
    getScene: () => {
      return new EmbeddedScene({
        $data: getQueryRunnerWithCSVWaveQuery({ valuesCSV: AIR_PASSENGERS }, { maxDataPointsFromWidth: false }),
        $timeRange: new SceneTimeRange({}),

        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneTimeRangeCompare({ key: 'top' }),
          new SceneChangepointDetector({}),
          new SceneRefreshPicker({}),
        ],
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              minWidth: '40%',
              minHeight: 500,
              body: PanelBuilders.timeseries()
                .setTitle('Changepoint detection')
                .build(),
            }),
          ],
        }),
      });
    },
  });
}
