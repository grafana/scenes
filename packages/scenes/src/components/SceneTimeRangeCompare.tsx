import React from 'react';
import { DateTime, dateTime, rangeUtil, TimeRange } from '@grafana/data';
import { ButtonGroup, ButtonSelect, Checkbox, Icon, ToolbarButton } from '@grafana/ui';
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

const PREVIOUS_PERIOD_VALUE = '__previousPeriod';

export const PREVIOUS_PERIOD_COMPARE_OPTION = {
  label: 'Previous period',
  value: PREVIOUS_PERIOD_VALUE,
};

export const DEFAULT_COMPARE_OPTIONS = [
  { label: '1 day before', value: '24h' },
  { label: '3 days before', value: '3d' },
  { label: '1 week before', value: '1w' },
  { label: '2 weeks before', value: '2w' },
  { label: '1 month before', value: '1M' },
  { label: '3 months before', value: '3M' },
  { label: '6 months before', value: '6M' },
  { label: '1 year before', value: '1y' },
];

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
        const compareOptions = this.getCompareOptions(timeRange.value);
        const stateUpdate: Partial<SceneTimeRangeCompareState> = { compareOptions };

        // if current compareWith is not applicable to the new time range, set it to previous period comparison
        if (Boolean(this.state.compareWith) && !compareOptions.find(({ value }) => value === this.state.compareWith)) {
          stateUpdate.compareWith = PREVIOUS_PERIOD_VALUE;
        }

        this.setState(stateUpdate);
      })
    );
  };

  public getCompareOptions = (timeRange: TimeRange) => {
    const diffDays = Math.ceil(timeRange.to.diff(timeRange.from));

    const matchIndex = DEFAULT_COMPARE_OPTIONS.findIndex(({ value }) => {
      const intervalInMs = rangeUtil.intervalToMs(value);
      return intervalInMs >= diffDays;
    });

    return [
      PREVIOUS_PERIOD_COMPARE_OPTION,
      ...DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value })),
    ];
  };

  public onCompareWithChanged = (compareWith: string) => {
    this.setState({ compareWith });
  };

  public onClearCompare = () => {
    this.setState({ compareWith: undefined });
  };

  public getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined {
    let compareFrom: DateTime;
    let compareTo: DateTime;

    if (this.state.compareWith) {
      if (this.state.compareWith === PREVIOUS_PERIOD_VALUE) {
        const diffMs = timeRange.to.diff(timeRange.from);
        compareFrom = dateTime(timeRange.from!).subtract(diffMs);
        compareTo = dateTime(timeRange.to!).subtract(diffMs);
      } else {
        compareFrom = dateTime(timeRange.from!).subtract(rangeUtil.intervalToMs(this.state.compareWith));
        compareTo = dateTime(timeRange.to!).subtract(rangeUtil.intervalToMs(this.state.compareWith));
      }
      return {
        from: compareFrom,
        to: compareTo,
        raw: {
          from: compareFrom,
          to: compareTo,
        },
      };
    }

    return undefined;
  }
}

function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>) {
  const { compareWith, compareOptions } = model.useState();
  const [enabled, setEnabled] = React.useState(false || Boolean(compareWith));
  const value = compareOptions.find((o) => o.value === compareWith);

  const onClick = () => {
    setEnabled(!enabled);
    if (enabled && Boolean(compareWith)) {
      model.onClearCompare();
    }
  };

  return (
    <ButtonGroup>
      <ToolbarButton
        variant="canvas"
        tooltip="Enable time frame comparison"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
      >
        <Checkbox label=" " value={enabled} onClick={onClick} />
        Time frame comparison
      </ToolbarButton>

      {enabled ? (
        <ButtonSelect
          variant="canvas"
          value={value}
          options={enabled ? compareOptions : []}
          onChange={(v) => {
            model.onCompareWithChanged(v.value!);
          }}
        />
      ) : (
        <ToolbarButton
          icon={<Icon name="angle-down" size="md" />}
          style={{ cursor: !enabled ? 'not-allowed' : 'pointer' }}
          variant="canvas"
        />
      )}
    </ButtonGroup>
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
