import { DataFrame, QueryResultMetaNotice } from '@grafana/data';
import { t } from '@grafana/i18n';
import { of } from 'rxjs';

import { ExtraQueryDataProcessor } from '../querying/ExtraQueryProvider';
import { getCompareSeriesRefId } from './getCompareSeriesRefId';

// Processor function for use with time shifted comparison series.
// This aligns the secondary series with the primary and adds custom
// metadata and config to the secondary series' fields so that it is
// rendered appropriately.
export const timeShiftAlignmentProcessor: ExtraQueryDataProcessor = (primary, secondary) => {
  const diff = secondary.timeRange.from.diff(primary.timeRange.from);

  // Surface a notice when the primary query returned data but the comparison query did not, so
  // users understand the empty comparison was expected rather than a silent failure. Frames without
  // rows (length === 0) count as "no data"; some data sources (e.g. Prometheus) return a fieldless
  // frame rather than no frames at all.
  const primaryHasData = primary.series.some((frame) => frame.length > 0);
  const secondaryHasData = secondary.series.some((frame) => frame.length > 0);
  const isEmptyComparison = primaryHasData && !secondaryHasData;

  // When the comparison returned no frames at all there is nothing to attach the notice to, so build
  // empty placeholder frames from the requested targets (falling back to a single frame).
  const sourceSeries: DataFrame[] =
    isEmptyComparison && secondary.series.length === 0
      ? secondary.request?.targets.map((target) => ({ refId: target.refId, fields: [], length: 0 })) ?? [
          { refId: '', fields: [], length: 0 },
        ]
      : secondary.series;

  const notice: QueryResultMetaNotice | undefined = isEmptyComparison
    ? {
        severity: 'info',
        text: t(
          'grafana-scenes.utils.time-shift-alignment-processor.no-data-notice',
          'No data returned for time comparison'
        ),
      }
    : undefined;

  // Build new frame objects rather than mutating secondary.series in place. With streaming/split-chunk
  // queries (e.g. Loki), the frame objects here are owned by the datasource's response accumulator and
  // get re-processed on every chunk - mutating refId in place made each re-processed chunk look like a
  // brand new series to the merge layer, appending duplicate compare series instead of replacing one.
  const series = sourceSeries.map((frame) => ({
    ...frame,
    refId: getCompareSeriesRefId(frame.refId || ''),
    meta: {
      ...frame.meta,
      timeCompare: {
        diffMs: diff,
        isTimeShiftQuery: true,
      },
      ...(notice ? { notices: [...(frame.meta?.notices ?? []), notice] } : {}),
    },
  }));

  return of({ ...secondary, series });
};
