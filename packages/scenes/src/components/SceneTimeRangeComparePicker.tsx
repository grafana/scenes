import { ButtonSelect, InlineField } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps } from '../core/types';
import { isSceneTimeRangeWithComparison } from './SceneTimeRangeWithComparison';

export class SceneTimeRangeComparePicker extends SceneObjectBase {
  static Component = SceneTimeRangeComparePickerRenderer;

  public getCompareOptions = () => {
    const timeRange = sceneGraph.getTimeRange(this);

    if (isSceneTimeRangeWithComparison(timeRange)) {
      return timeRange.provideCompareOptions();
    }

    throw new Error('SceneTimeRangeComparePicker can only be used with SceneTimeRangeWithComparison');
  };

  public getTimeRange = () => {
    const timeRange = sceneGraph.getTimeRange(this);
    if (isSceneTimeRangeWithComparison(timeRange)) {
      return timeRange;
    }
    throw new Error('SceneTimeRangeComparePicker can only be used with SceneTimeRangeWithComparison');
  };

  public onCompareWithChanged = (compareWith: string) => {
    const timeRange = this.getTimeRange();
    timeRange.onCompareChange(compareWith);
  };
}

function SceneTimeRangeComparePickerRenderer({ model }: SceneComponentProps<SceneTimeRangeComparePicker>) {
  const options = model.getCompareOptions();
  const tr = model.getTimeRange().useState();
  const value = options.find((o) => o.value === tr.compareTo);

  return (
    // UI here is temporary, just for the sake of testing the functionality
    <InlineField label="Compare with:">
      <ButtonSelect
        value={value}
        variant="canvas"
        options={options}
        onChange={(v) => {
          model.onCompareWithChanged(v.value!);
        }}
      />
    </InlineField>
  );
}
