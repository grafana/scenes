import React from 'react';

import { TimeRangePicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneControlObject, SceneObjectState } from '../core/types';

export interface SceneTimePickerState extends SceneObjectState {
  hidePicker?: boolean;
  isOnCanvas?: boolean;
}

export class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> implements SceneControlObject {
  public static Component = SceneTimePickerRenderer;

  public getPositionPreference() {
    return 'right' as const;
  }
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();

  if (hidePicker) {
    return null;
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
      onZoom={() => {}}
      onChangeTimeZone={timeRange.onTimeZoneChange}
      onChangeFiscalYearStartMonth={() => {}}
    />
  );
}
