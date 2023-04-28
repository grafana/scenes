import { TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';
import { sceneGraph } from './sceneGraph';
import { SceneObjectBase } from './SceneObjectBase';
import { evaluateTimeRange } from './SceneTimeRange';
import { SceneTimeRangeLike, SceneTimeRangeState } from './types';

interface SceneTimeZoneOverrideState extends SceneTimeRangeState {
  timeZone: TimeZone;
}

export class SceneTimeZoneOverride extends SceneObjectBase<SceneTimeZoneOverrideState> implements SceneTimeRangeLike {
  public constructor(state: Omit<SceneTimeZoneOverrideState, 'from' | 'to' | 'value'>) {
    super({
      ...state,
      timeZone: state.timeZone,
      // Fake time range, it's actually provided via closest time range object on activation
      from: 'now-6h',
      to: 'now',
      value: evaluateTimeRange('now-6h', 'now', state.timeZone),
    });

    this.addActivationHandler(this._activationHandler);
  }

  private getTimeRangeObject() {
    if (!this.parent || !this.parent.parent) {
      throw new Error('SceneTimeZoneOverride must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  private _activationHandler = () => {
    const timeRangeObject = this.getTimeRangeObject();
    const { from, to } = timeRangeObject.state;
    this.setState({
      from,
      to,
      value: evaluateTimeRange(from, to, this.state.timeZone),
    });

    this._subs.add(
      timeRangeObject.subscribeToState((n) => {
        this.setState({
          from: n.from,
          to: n.to,
          value: evaluateTimeRange(n.from, n.to, this.state.timeZone),
        });
      })
    );
  };

  public getTimeZone(): TimeZone {
    return this.state.timeZone;
  }
  public onTimeRangeChange(timeRange: TimeRange): void {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onTimeRangeChange(timeRange);
  }

  public onTimeZoneChange(timeZone: string): void {
    this.setState({ timeZone, value: evaluateTimeRange(this.state.from, this.state.to, timeZone) });
  }

  public onRefresh(): void {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onRefresh();
  }
}
