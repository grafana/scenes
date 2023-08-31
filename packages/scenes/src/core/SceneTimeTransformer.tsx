import { TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';
import { sceneGraph } from './sceneGraph';
import { SceneObjectBase } from './SceneObjectBase';
import { evaluateTimeRange } from './SceneTimeRange';
import { SceneTimeRangeLike, SceneTimeRangeState } from './types';

export abstract class SceneTimeRangeTransformer<T extends SceneTimeRangeState>
  extends SceneObjectBase<T>
  implements SceneTimeRangeLike
{
  public constructor(state: T) {
    super(state);

    this.addActivationHandler(this._activationHandler);
  }

  protected getAncestorTimeRange() {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + ' must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  private _activationHandler = () => {
    const ancestorTimeRange = this.getAncestorTimeRange();

    this.parentTimeRangeChanged(ancestorTimeRange.state);

    this._subs.add(ancestorTimeRange.subscribeToState((s) => this.parentTimeRangeChanged(s)));
  };

  protected abstract parentTimeRangeChanged(timeRange: SceneTimeRangeState): void;

  public getTimeZone(): TimeZone {
    return this.getAncestorTimeRange().getTimeZone();
  }

  public onTimeRangeChange(timeRange: TimeRange): void {
    this.getAncestorTimeRange().onTimeRangeChange(timeRange);
  }

  public onTimeZoneChange(timeZone: string): void {
    //@ts-ignore
    this.setState({ timeZone, value: evaluateTimeRange(this.state.from, this.state.to, timeZone) });
  }

  public onRefresh(): void {
    this.getAncestorTimeRange().onRefresh();
  }
}
