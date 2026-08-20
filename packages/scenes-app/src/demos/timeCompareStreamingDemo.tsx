import { Observable, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';

import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  TestDataSourceResponse,
  toDataFrame,
} from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import {
  EmbeddedScene,
  PanelBuilders,
  RuntimeDataSource,
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
  sceneUtils,
} from '@grafana/scenes';

const DATASOURCE_TYPE = 'timecompare-streaming-repro';
const DATASOURCE_UID = 'timecompare-streaming-repro-uid';
const NUM_CHUNKS = 8;
const CHUNK_INTERVAL_MS = 200;

/**
 * Regression demo for the timeCompare + streaming duplicate-series bug (see grafana/scenes#1554,
 * which changed forkJoin->combineLatest and made this reachable).
 *
 * Real Loki split queries stream several partial responses per query, merging each new chunk into
 * a running accumulator keyed by refId+name (see the Loki datasource's combineResponses/mergeFrames) -
 * the frame object handed to any downstream consumer for a given refId is the SAME object across
 * chunks, just extended with more data. This datasource fakes that same shape: one frame per query,
 * reused by reference and appended to on every emission, instead of a fresh frame each time.
 *
 * With the (fixed) non-mutating timeShiftAlignmentProcessor, every chunk computes the same
 * "A-compare" identity from the untouched input frame, so the panel always shows exactly one
 * comparison series. With the old, mutating processor, the shared frame's refId gets rewritten
 * ("A" -> "A-compare" -> "A-compare-compare" -> ...) on every chunk, so each chunk looks like a
 * brand new series to the legend/renderer and duplicates accumulate instead of being replaced.
 */
class TimeCompareStreamingRepro extends RuntimeDataSource {
  query(request: DataQueryRequest): Observable<DataQueryResponse> {
    const from = request.range.from.valueOf();
    const to = request.range.to.valueOf();
    const step = (to - from) / NUM_CHUNKS;

    // Held across emissions of this one query() call - this is the accumulator. Its frame object
    // identity never changes across chunks, only its contents grow, mirroring combineResponses.
    let accumulated: DataFrame | undefined;

    return timer(0, CHUNK_INTERVAL_MS).pipe(
      take(NUM_CHUNKS),
      map((i) => {
        const time = from + step * (i + 1);
        // Value is a continuous function of the timestamp so the shifted comparison query returns
        // visibly different data for ANY compare offset. (A range-derived base aliases: e.g. a
        // previous-period shift of 24h with a 12h modulus lands on the same value.) The 1.7h
        // angular scale keeps common offsets (1h/24h/7d) well away from the sine's period.
        const value = 10 + 5 * Math.sin(time / (60 * 60 * 1000) / 1.7);

        if (!accumulated) {
          accumulated = toDataFrame({
            refId: request.targets[0]?.refId ?? 'A',
            fields: [
              { name: 'Time', type: FieldType.time, values: [time] },
              { name: 'Value', type: FieldType.number, values: [value] },
            ],
          });
        } else {
          accumulated.fields[0].values.push(time);
          accumulated.fields[1].values.push(value);
        }

        return {
          key: request.requestId,
          state: i === NUM_CHUNKS - 1 ? LoadingState.Done : LoadingState.Streaming,
          data: [accumulated],
        };
      })
    );
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}

export function getTimeCompareStreamingDemo(defaults: SceneAppPageState) {
  sceneUtils.registerRuntimeDataSource({
    dataSource: new TimeCompareStreamingRepro(DATASOURCE_TYPE, DATASOURCE_UID),
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        $timeRange: new SceneTimeRange({}),
        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          // Comparison on by default - the whole point of this demo is watching the compare
          // series stay singular while chunks stream in.
          new SceneTimeRangeCompare({ compareWith: '__previousPeriod' }),
          new SceneRefreshPicker({}),
        ],
        body: new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              minHeight: 400,
              body: PanelBuilders.timeseries()
                .setTitle('timeCompare + streaming duplicate series (regression demo)')
                .setDescription(
                  'Comparison is on by default. Each streamed chunk reuses the same frame ' +
                    'object, like a Loki split query. On unfixed code the legend accumulates duplicate ' +
                    '"(comparison)" entries per chunk; on fixed code it always shows exactly one.'
                )
                .setData(
                  new SceneQueryRunner({
                    datasource: { uid: DATASOURCE_UID, type: DATASOURCE_TYPE },
                    queries: [{ refId: 'A' }],
                  })
                )
                .build(),
            }),
          ],
        }),
      });
    },
  });
}
