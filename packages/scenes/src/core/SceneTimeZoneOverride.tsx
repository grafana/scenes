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
  public constructor(state: Partial<Omit<SceneTimeZoneOverrideState, 'from' | 'to' | 'value'>>) {
    super({
      timeZone: state.timeZone ?? 'browser',
      // Fake time range, it's actually provided via proxy set up on activation
      from: 'now-6h',
      to: 'now',
      value: evaluateTimeRange('now-6h', 'now', state.timeZone ?? 'browser'),
    });

    this.addActivationHandler(this._activationHandler);
  }

  private proxyTimeRange() {
    const timeRangeObject = this.getTimeRangeObject();
    this._state = new Proxy(this._state, {
      get: (target, prop) => {
        // Proxy from and to to the time range object
        if (prop === 'from' || prop === 'to') {
          return timeRangeObject.state[prop];
        }

        // Evaluate time range with overriden time zone
        if (prop === 'value') {
          return evaluateTimeRange(timeRangeObject.state.from, timeRangeObject.state.to, target.timeZone);
        }

        // Return overriden time zone
        if (prop === 'timeZone') {
          return target.timeZone;
        }

        // @ts-ignore
        return target[prop];
      },
    });
  }

  private getTimeRangeObject() {
    if (!this.parent || !this.parent.parent) {
      throw new Error('SceneTimeZoneOverride must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  private _activationHandler = () => {
    const timeRangeObject = this.getTimeRangeObject();
    this.proxyTimeRange();

    this._subs.add(
      timeRangeObject.subscribeToState((n, p) => {
        if (n.value.from !== p.value.from || n.value.to !== p.value.to) {
          this.forceRender();
        }
      })
    );
  };

  public setState(update: Partial<SceneTimeZoneOverrideState>): void {
    super.setState(update);
    this.proxyTimeRange();
  }

  public onTimeRangeChange(timeRange: TimeRange): void {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onTimeRangeChange(timeRange);
  }

  public onTimeZoneChange(timeZone: string): void {
    this.setState({ timeZone });
  }

  public onRefresh(): void {
    const timeRangeObject = this.getTimeRangeObject();
    timeRangeObject.onRefresh();
  }
}
