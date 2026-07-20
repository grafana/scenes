import { of } from 'rxjs';

import { ExtraQueryDataProcessor } from '../querying/ExtraQueryProvider';
import { getCompareSeriesRefId } from './getCompareSeriesRefId';

// Processor function for use with time shifted comparison series.
// This aligns the secondary series with the primary and adds custom
// metadata and config to the secondary series' fields so that it is
// rendered appropriately.
export const timeShiftAlignmentProcessor: ExtraQueryDataProcessor = (primary, secondary) => {
  const diff = secondary.timeRange.from.diff(primary.timeRange.from);
  // Build new frame objects rather than mutating secondary.series in place. With streaming/split-chunk
  // queries (e.g. Loki), the frame objects here are owned by the datasource's response accumulator and
  // get re-processed on every chunk - mutating refId in place made each re-processed chunk look like a
  // brand new series to the merge layer, appending duplicate compare series instead of replacing one.
  const series = secondary.series.map((frame) => ({
    ...frame,
    refId: getCompareSeriesRefId(frame.refId || ''),
    meta: {
      ...frame.meta,
      timeCompare: {
        diffMs: diff,
        isTimeShiftQuery: true,
      },
    },
  }));
  return of({ ...secondary, series });
};
