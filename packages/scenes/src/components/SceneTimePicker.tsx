import React from 'react';

import { TimeRangePicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { TimeRange, toUtc } from '@grafana/data';

export interface SceneTimePickerState extends SceneObjectState {
  hidePicker?: boolean;
  isOnCanvas?: boolean;
}

export class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> {
  public static Component = SceneTimePickerRenderer;
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();

  if (hidePicker) {
    return null;
  }

  function onZoom() {
    const zoomedTimeRange = getZoomedTimeRange(timeRangeState.value, 2);

    timeRange.onTimeRangeChange(zoomedTimeRange);
  }

  return (
    <TimeRangePicker
      isOnCanvas={isOnCanvas ?? true}
      value={timeRangeState.value}
      onChange={timeRange.onTimeRangeChange}
      timeZone={timeZone}
      fiscalYearStartMonth={0}
      onMoveBackward={() => {}}
      onMoveForward={() => {}}
      onZoom={onZoom}
      onChangeTimeZone={timeRange.onTimeZoneChange}
      onChangeFiscalYearStartMonth={() => {}}
    />
  );
}

function getZoomedTimeRange(timeRange: TimeRange, factor: number): TimeRange {
  const timespan = timeRange.to.valueOf() - timeRange.from.valueOf();
  const center = timeRange.to.valueOf() - timespan / 2;
  // If the timepsan is 0, zooming out would do nothing, so we force a zoom out to 30s
  const newTimespan = timespan === 0 ? 30000 : timespan * factor;

  const to = center + newTimespan / 2;
  const from = center - newTimespan / 2;

  return { from: toUtc(from), to: toUtc(to), raw: { from: toUtc(from), to: toUtc(to) } };
}
