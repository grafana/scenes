import { TimeZone } from '@grafana/schema';
import { evaluateTimeRange } from './SceneTimeRange';
import { SceneTimeRangeLike, SceneTimeRangeState } from './types';
import { SceneTimeRangeTransformer } from './SceneTimeTransformer';

interface SceneTimeZoneOverrideState extends SceneTimeRangeState {
  timeZone: TimeZone;
}

export class SceneTimeZoneOverride
  extends SceneTimeRangeTransformer<SceneTimeZoneOverrideState>
  implements SceneTimeRangeLike
{
  public constructor(state: Omit<SceneTimeZoneOverrideState, 'from' | 'to' | 'value'>) {
    super({
      ...state,
      timeZone: state.timeZone,
      // Fake time range, it's actually provided via closest time range object on activation
      from: 'now-6h',
      to: 'now',
      value: evaluateTimeRange('now-6h', 'now', state.timeZone),
    });
  }

  protected parentTimeRangeChanged(timeRange: SceneTimeRangeState): void {
    this.setState({ value: evaluateTimeRange(timeRange.from, timeRange.to, this.state.timeZone) });
  }

  public getTimeZone(): TimeZone {
    return this.state.timeZone;
  }
}
