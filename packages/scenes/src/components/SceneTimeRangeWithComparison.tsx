import { dateTime, getTimeZone, rangeUtil, TimeRange } from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { evaluateTimeRange } from '../core/SceneTimeRange';
import { SceneObjectUrlValues, SceneTimeRangeLike, SceneTimeRangeState } from '../core/types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

interface SceneTimeRangeWithComparisonState extends SceneTimeRangeState {
  compareTo?: string;
}

interface MultiTimeRangeProvider extends SceneTimeRangeLike {
  getTimeRanges(): [TimeRange, TimeRange | undefined];
}

export class SceneTimeRangeWithComparison
  extends SceneObjectBase<SceneTimeRangeWithComparisonState>
  implements MultiTimeRangeProvider
{
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['compareTo'] });

  public constructor(state: Partial<SceneTimeRangeWithComparisonState>) {
    super({
      ...state,
      // Fake time range, it's actually provided via closest time range object on activation
      from: 'now-6h',
      to: 'now',
      value: evaluateTimeRange('now-6h', 'now', state.timeZone || getTimeZone()),
    });

    this.addActivationHandler(this._activationHandler);
  }

  public getUrlState() {
    return { from: this.state.from, to: this.state.to };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    // TODO
  }

  private _activationHandler = () => {
    const timeRangeObject = this.getTimeRangeObject();
    const { from, to } = timeRangeObject.state;
    this.setState({
      from,
      to,
      value: evaluateTimeRange(from, to, timeRangeObject.getTimeZone()),
    });

    this._subs.add(
      timeRangeObject.subscribeToState((n) => {
        this.setState({
          from: n.from,
          to: n.to,
          value: evaluateTimeRange(n.from, n.to, timeRangeObject.getTimeZone()),
        });
      })
    );
  };

  public onTimeRangeChange = (timeRange: TimeRange) => {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onTimeRangeChange(timeRange);
  };

  public onTimeZoneChange = (timeZone: string) => {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onTimeZoneChange(timeZone);
  };

  public getTimeZone(): string {
    const timeRangeObject = this.getTimeRangeObject();
    return timeRangeObject.getTimeZone();
  }

  public onRefresh() {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onRefresh();
  }

  public onCompareChange = (compareTo: string) => {
    this.setState({ compareTo });
  };

  private getTimeRangeObject = () => {
    if (this.state.$timeRange) {
      return this.state.$timeRange;
    }

    return sceneGraph.getTimeRange(this.parent!.parent!);
  };

  public getTimeRanges = (): [TimeRange, TimeRange | undefined] => {
    const timeRangeObject = this.getTimeRangeObject();
    const timeRange = timeRangeObject.state.value;

    let compareTimeRange: TimeRange | undefined;
    if (this.state.compareTo) {
      const compareFrom = dateTime(timeRange.from!).subtract(rangeUtil.intervalToMs(this.state.compareTo));
      const compareTo = dateTime(timeRange.to!).subtract(rangeUtil.intervalToMs(this.state.compareTo));

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
  };

  public provideCompareOptions = () => {
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
}

export function isSceneTimeRangeWithComparison(obj: any): obj is SceneTimeRangeWithComparison {
  return Object.prototype.hasOwnProperty.call(obj, 'provideCompareOptions');
}

export function isMultiTimeRangeProvider(obj: any): obj is MultiTimeRangeProvider {
  return Object.prototype.hasOwnProperty.call(obj, 'getTimeRanges');
}
