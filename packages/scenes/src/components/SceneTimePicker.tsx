import React from 'react';
import { useLocalStorage } from 'react-use';
import { uniqBy } from 'lodash';

import { TimeRange, isDateTime, rangeUtil, toUtc } from '@grafana/data';
import { TimeRangePicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObjectState } from '../core/types';

export interface SceneTimePickerState extends SceneObjectState {
  hidePicker?: boolean;
  isOnCanvas?: boolean;
}

export class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> {
  public static Component = SceneTimePickerRenderer;

  public onZoom = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const zoomedTimeRange = getZoomedTimeRange(timeRange.state.value, 2);
    timeRange.onTimeRangeChange(zoomedTimeRange);
  };

  public onChangeFiscalYearStartMonth = (month: number) => {
    const timeRange = sceneGraph.getTimeRange(this);
    timeRange.setState({ fiscalYearStartMonth: month });
  };

  public toAbsolute = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const timeRangeVal = timeRange.state.value;
    const from = toUtc(timeRangeVal.from);
    const to = toUtc(timeRangeVal.to);
    timeRange.onTimeRangeChange({ from, to, raw: { from, to } });
  };

  public onMoveBackward = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const {
      state: { value: range },
    } = timeRange;

    timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Backward, range, Date.now()));
  };

  public onMoveForward = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    const {
      state: { value: range },
    } = timeRange;

    timeRange.onTimeRangeChange(getShiftedTimeRange(TimeRangeDirection.Forward, range, Date.now()));
  };
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();
  const [timeRangeHistory, setTimeRangeHistory] = useLocalStorage<TimeRange[]>(HISTORY_LOCAL_STORAGE_KEY, [], {
    raw: false,
    serializer: serializeHistory,
    deserializer: deserializeHistory,
  });

  if (hidePicker) {
    return null;
  }

  return (
    <TimeRangePicker
      isOnCanvas={isOnCanvas ?? true}
      value={timeRangeState.value}
      onChange={(range) => {
        if (isAbsolute(range)) {
          setTimeRangeHistory([range, ...(timeRangeHistory ?? [])]);
        }

        timeRange.onTimeRangeChange(range);
      }}
      timeZone={timeZone}
      fiscalYearStartMonth={timeRangeState.fiscalYearStartMonth}
      onMoveBackward={model.onMoveBackward}
      onMoveForward={model.onMoveForward}
      onZoom={model.onZoom}
      onChangeTimeZone={timeRange.onTimeZoneChange}
      onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
      // @ts-ignore TODO remove after grafana/ui update to 11.2.0
      weekStart={timeRangeState.weekStart}
      history={timeRangeHistory}
    />
  );
}

export function getZoomedTimeRange(timeRange: TimeRange, factor: number): TimeRange {
  const timespan = timeRange.to.valueOf() - timeRange.from.valueOf();
  const center = timeRange.to.valueOf() - timespan / 2;
  // If the timepsan is 0, zooming out would do nothing, so we force a zoom out to 30s
  const newTimespan = timespan === 0 ? 30000 : timespan * factor;

  const to = center + newTimespan / 2;
  const from = center - newTimespan / 2;

  return { from: toUtc(from), to: toUtc(to), raw: { from: toUtc(from), to: toUtc(to) } };
}

export enum TimeRangeDirection {
  Backward,
  Forward,
}

export function getShiftedTimeRange(dir: TimeRangeDirection, timeRange: TimeRange, upperLimit: number): TimeRange {
  const oldTo = timeRange.to.valueOf();
  const oldFrom = timeRange.from.valueOf();
  const halfSpan = (oldTo - oldFrom) / 2;

  let fromRaw: number;
  let toRaw: number;
  if (dir === TimeRangeDirection.Backward) {
    fromRaw = oldFrom - halfSpan;
    toRaw = oldTo - halfSpan;
  } else {
    fromRaw = oldFrom + halfSpan;
    toRaw = oldTo + halfSpan;

    if (toRaw > upperLimit && oldTo < upperLimit) {
      toRaw = upperLimit;
      fromRaw = oldFrom;
    }
  }

  const from = toUtc(fromRaw);
  const to = toUtc(toRaw);
  return {
    from,
    to,
    raw: { from, to },
  };
}

const HISTORY_LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';

// Simplified object to store in local storage
interface TimePickerHistoryItem {
  from: string;
  to: string;
}

function deserializeHistory(value: string): TimeRange[] {
  const values: TimePickerHistoryItem[] = JSON.parse(value);
  // The history is saved in UTC and with the default date format, so we need to pass those values to the convertRawToRange
  return values.map((item) => rangeUtil.convertRawToRange(item, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss'));
}

function serializeHistory(values: TimeRange[]) {
  return JSON.stringify(
    limit(
      values.map((v) => ({
        from: typeof v.raw.from === 'string' ? v.raw.from : v.raw.from.toISOString(),
        to: typeof v.raw.to === 'string' ? v.raw.to : v.raw.to.toISOString(),
      }))
    )
  );
}

function limit(value: TimePickerHistoryItem[]): TimePickerHistoryItem[] {
  return uniqBy(value, (v) => v.from + v.to).slice(0, 4);
}

function isAbsolute(value: TimeRange): boolean {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}
