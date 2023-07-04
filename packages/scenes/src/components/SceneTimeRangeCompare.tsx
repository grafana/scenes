import React from 'react';
import { dateTime, rangeUtil, TimeRange } from '@grafana/data';
import { ButtonSelect, IconButton, InlineField } from '@grafana/ui';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../core/types';

export interface MultiTimeRangeProvider {
  getTimeRanges(): [TimeRange, TimeRange | undefined];
}

interface SceneTimeRangeCompareState extends SceneObjectState {
  compareWith?: string;
}

export class SceneTimeRangeCompare
  extends SceneObjectBase<SceneTimeRangeCompareState>
  implements MultiTimeRangeProvider
{
  static Component = SceneTimeRangeCompareRenderer;

  public constructor(state: Partial<SceneTimeRangeCompareState>) {
    super(state);
  }

  public getCompareOptions = () => {
    // const timeRange = sceneGraph.getTimeRange(this);

    // TODO - those options should be provided based on the selected time range, this is faking for now
    return [
      {
        label: 'A day ago',
        value: '24h',
      },
      {
        label: 'A week ago',
        value: '7d',
      },
    ];
  };

  public onCompareWithChanged = (compareWith: string) => {
    this.setState({ compareWith });
  };

  public onClearCompare = () => {
    this.setState({ compareWith: undefined });
  };

  public getTimeRanges(): [TimeRange, TimeRange | undefined] {
    const timeRangeObject = sceneGraph.getTimeRange(this);
    const timeRange = timeRangeObject.state.value;

    let compareTimeRange: TimeRange | undefined;
    if (this.state.compareWith) {
      const compareFrom = dateTime(timeRange.from!).subtract(rangeUtil.intervalToMs(this.state.compareWith));
      const compareTo = dateTime(timeRange.to!).subtract(rangeUtil.intervalToMs(this.state.compareWith));

      compareTimeRange = {
        from: compareFrom,
        to: compareTo,
        raw: {
          from: compareFrom,
          to: compareTo,
        },
      };
    }

    return [timeRange, compareTimeRange];
  }
}

function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>) {
  const options = model.getCompareOptions();
  const { compareWith } = model.useState();
  const value = options.find((o) => o.value === compareWith);

  return (
    // UI here is temporary, just for the sake of testing the functionality
    <InlineField label="Compare with:">
      <>
        <ButtonSelect
          value={value}
          variant="canvas"
          options={options}
          onChange={(v) => {
            model.onCompareWithChanged(v.value!);
          }}
        />
        {compareWith && <IconButton name="trash-alt" onClick={model.onClearCompare} />}
      </>
    </InlineField>
  );
}

// type guard for MultiTimeRangeProvider
export function isMultiTimeRangeProvider(obj: any): obj is MultiTimeRangeProvider {
  return obj && typeof obj.getTimeRanges === 'function';
}
