import React from 'react';

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
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeRangeState = timeRange.useState();

  if (hidePicker) {
    return null;
  }

  return (
    <TimeRangePicker
      isOnCanvas={isOnCanvas}
      value={timeRangeState.value}
      onChange={timeRange.onTimeRangeChange}
      timeZone={'browser'}
      fiscalYearStartMonth={0}
      onMoveBackward={() => {}}
      onMoveForward={() => {}}
      onZoom={() => {}}
      onChangeTimeZone={() => {}}
      onChangeFiscalYearStartMonth={() => {}}
    />
  );
}
