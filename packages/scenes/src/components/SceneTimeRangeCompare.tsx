import React from 'react';
import { dateTime, rangeUtil, TimeRange } from '@grafana/data';
import { ButtonSelect, IconButton, InlineField } from '@grafana/ui';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';

export interface TimeRangeCompareProvider {
  getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined;
}

interface SceneTimeRangeCompareState extends SceneObjectState {
  compareWith?: string;
  compareOptions: Array<{ label: string; value: string }>;
}

export const DEFAULT_COMPARE_OPTIONS = [
  { label: 'A day ago', days: 1, value: '24h' },
  { label: '3 days ago', days: 3, value: '3d' },
  { label: 'A week ago', days: 7, value: '1w' },
  { label: '2 weeks ago', days: 14, value: '2w' },
  { label: 'A month ago', days: 31, value: '1M' },
  { label: '6 months ago', days: 31 * 6, value: '6M' },
  { label: 'A year ago', days: 365, value: '1y' },
];

const ONE_DAY_MS_LENGTH = 1000 * 60 * 60 * 24;

export class SceneTimeRangeCompare
  extends SceneObjectBase<SceneTimeRangeCompareState>
  implements TimeRangeCompareProvider
{
  static Component = SceneTimeRangeCompareRenderer;

  public constructor(state: Partial<SceneTimeRangeCompareState>) {
    super({ compareOptions: DEFAULT_COMPARE_OPTIONS, ...state });
    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const sceneTimeRange = sceneGraph.getTimeRange(this);
    this.setState({ compareOptions: this.getCompareOptions(sceneTimeRange.state.value) });

    this._subs.add(
      sceneTimeRange.subscribeToState((timeRange) => {
        this.setState({ compareOptions: this.getCompareOptions(timeRange.value) });
      })
    );
  };

  public getCompareOptions = (timeRange: TimeRange) => {
    const diffDays = Math.ceil(timeRange.to.diff(timeRange.from) / ONE_DAY_MS_LENGTH);
    const matchIndex = DEFAULT_COMPARE_OPTIONS.findIndex(({ days }) => days >= diffDays);

    return DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value }));
  };

  public onCompareWithChanged = (compareWith: string) => {
    this.setState({ compareWith });
  };

  public onClearCompare = () => {
    this.setState({ compareWith: undefined });
  };

  public getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined {
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

    return compareTimeRange;
  }
}

function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>) {
  const { compareWith, compareOptions } = model.useState();
  const value = compareOptions.find((o) => o.value === compareWith);

  return (
    // UI here is temporary, just for the sake of testing the functionality
    <InlineField label="Compare with:">
      <>
        <ButtonSelect
          value={value}
          variant="canvas"
          options={compareOptions}
          onChange={(v) => {
            model.onCompareWithChanged(v.value!);
          }}
        />
        {compareWith && <IconButton name="trash-alt" onClick={model.onClearCompare} />}
      </>
    </InlineField>
  );
}

// type guard for TimeRangeCompareProvider
export function isTimeRangeCompareProvider(obj: unknown): obj is TimeRangeCompareProvider {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as TimeRangeCompareProvider).getCompareTimeRange === 'function'
  );
}
