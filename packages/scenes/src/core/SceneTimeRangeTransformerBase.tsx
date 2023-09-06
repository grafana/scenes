import { TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';
import { sceneGraph } from './sceneGraph';
import { SceneObjectBase } from './SceneObjectBase';
import { SceneTimeRangeLike, SceneTimeRangeState } from './types';

/**
 * @internal
 * Used by SceneTimeZoneOverride and main repo PanelTimeRange.
 * Not recommened to be used by plugins directly.
 */
export abstract class SceneTimeRangeTransformerBase<T extends SceneTimeRangeState>
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

    this.ancestorTimeRangeChanged(ancestorTimeRange.state);

    this._subs.add(ancestorTimeRange.subscribeToState((s) => this.ancestorTimeRangeChanged(s)));
  };

  protected abstract ancestorTimeRangeChanged(timeRange: SceneTimeRangeState): void;

  public getTimeZone(): TimeZone {
    return this.getAncestorTimeRange().getTimeZone();
  }

  public onTimeRangeChange(timeRange: TimeRange): void {
    this.getAncestorTimeRange().onTimeRangeChange(timeRange);
  }

  public onTimeZoneChange(timeZone: string): void {
    this.getAncestorTimeRange().onTimeZoneChange(timeZone);
  }

  public onRefresh(): void {
    this.getAncestorTimeRange().onRefresh();
  }
}
