import { TimeZone } from '@grafana/schema';
import { evaluateTimeRange } from './SceneTimeRange';
import { SceneTimeRangeLike, SceneTimeRangeState } from './types';
import { SceneTimeRangeTransformerBase } from './SceneTimeRangeTransformerBase';
import { getDefaultTimeRange } from '@grafana/data';

interface SceneTimeZoneOverrideState extends SceneTimeRangeState {
  timeZone: TimeZone;
}

export class SceneTimeZoneOverride
  extends SceneTimeRangeTransformerBase<SceneTimeZoneOverrideState>
  implements SceneTimeRangeLike
{
  public constructor(state: Omit<SceneTimeZoneOverrideState, 'from' | 'to' | 'value'>) {
    super({
      ...state,
      timeZone: state.timeZone,
      // Real time range is deifined
      from: 'now-6h',
      to: 'now',
      value: getDefaultTimeRange(),
    });
  }

  protected ancestorTimeRangeChanged(timeRange: SceneTimeRangeState): void {
    this.setState({
      ...timeRange,
      timeZone: this.state.timeZone,
      value: evaluateTimeRange(timeRange.from, timeRange.to, this.state.timeZone),
    });
  }

  public getTimeZone(): TimeZone {
    return this.state.timeZone;
  }

  public onTimeZoneChange(timeZone: string): void {
    this.setState({ timeZone, value: evaluateTimeRange(this.state.from, this.state.to, this.state.timeZone) });
  }
}
