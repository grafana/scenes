import React from 'react';

import { TimeRangePicker } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObjectStatePlain } from '../core/types';
import { ItemWithLabel } from './ItemWithLabel';

export interface SceneTimePickerState extends SceneObjectStatePlain {
  hidePicker?: boolean;
  isOnCanvas?: boolean;
  label?: string;
}

export class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> {
  public static Component = SceneTimePickerRenderer;
}

function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas, label } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeRangeState = timeRange.useState();

  if (hidePicker) {
    return null;
  }

  return (
    <ItemWithLabel label={label}>
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
    </ItemWithLabel>
  );
}
