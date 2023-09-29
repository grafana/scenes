import { getTimeZone, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneTimeRangeLike, SceneTimeRangeState, SceneObjectUrlValues } from './types';
import { getClosest } from './sceneGraph/utils';
import { parseUrlParam } from '../utils/parseUrlParam';
import { evaluateTimeRange } from '../utils/evaluateTimeRange';

export class SceneTimeRange extends SceneObjectBase<SceneTimeRangeState> implements SceneTimeRangeLike {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['from', 'to'] });

  public constructor(state: Partial<SceneTimeRangeState> = {}) {
    const from = state.from ?? 'now-6h';
    const to = state.to ?? 'now';
    const timeZone = state.timeZone;
    const value = evaluateTimeRange(from, to, timeZone || getTimeZone(), state.fiscalYearStartMonth);
    super({ from, to, timeZone, value, ...state });

    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    // When SceneTimeRange has no time zone provided, find closest source of time zone and subscribe to it
    if (!this.state.timeZone) {
      const timeZoneSource = this.getTimeZoneSource();
      if (timeZoneSource !== this) {
        this._subs.add(
          timeZoneSource.subscribeToState((n, p) => {
            if (n.timeZone !== undefined && n.timeZone !== p.timeZone) {
              this.setState({
                value: evaluateTimeRange(
                  this.state.from,
                  this.state.to,
                  timeZoneSource.getTimeZone(),
                  this.state.fiscalYearStartMonth
                ),
              });
            }
          })
        );
      }
    }
  };

  /**
   * Will traverse up the scene graph to find the closest SceneTimeRangeLike with time zone set
   */
  private getTimeZoneSource() {
    if (!this.parent || !this.parent.parent) {
      return this;
    }
    // Find the closest source of time zone
    const source = getClosest<SceneTimeRangeLike>(this.parent.parent, (o) => {
      if (o.state.$timeRange && o.state.$timeRange.state.timeZone) {
        return o.state.$timeRange;
      }
      return undefined;
    });

    if (!source) {
      return this;
    }

    return source;
  }

  public getTimeZone(): TimeZone {
    // Return local time zone if provided
    if (this.state.timeZone) {
      return this.state.timeZone;
    }

    // Resolve higher level time zone source
    const timeZoneSource = this.getTimeZoneSource();
    if (timeZoneSource !== this) {
      return timeZoneSource.state.timeZone!;
    }

    // Return default time zone
    return getTimeZone();
  }

  public onTimeRangeChange = (timeRange: TimeRange) => {
    const update: Partial<SceneTimeRangeState> = {};

    if (typeof timeRange.raw.from === 'string') {
      update.from = timeRange.raw.from;
    } else {
      update.from = timeRange.raw.from.toISOString();
    }

    if (typeof timeRange.raw.to === 'string') {
      update.to = timeRange.raw.to;
    } else {
      update.to = timeRange.raw.to.toISOString();
    }

    update.value = evaluateTimeRange(update.from, update.to, this.getTimeZone(), this.state.fiscalYearStartMonth);

    // Only update if time range actually changed
    if (update.from !== this.state.from || update.to !== this.state.to) {
      this.setState(update);
    }
  };

  public onTimeZoneChange = (timeZone: TimeZone) => {
    this.setState({ timeZone });
  };

  public onRefresh = () => {
    this.setState({
      value: evaluateTimeRange(this.state.from, this.state.to, this.getTimeZone(), this.state.fiscalYearStartMonth),
    });
  };

  public getUrlState() {
    return { from: this.state.from, to: this.state.to };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    // ignore if both are missing
    if (!values.to && !values.from) {
      return;
    }

    const update: Partial<SceneTimeRangeState> = {};
    const from = parseUrlParam(values.from);

    if (from) {
      update.from = from;
    }

    const to = parseUrlParam(values.to);
    if (to) {
      update.to = to;
    }

    update.value = evaluateTimeRange(
      update.from ?? this.state.from,
      update.to ?? this.state.to,
      this.getTimeZone(),
      this.state.fiscalYearStartMonth
    );
    this.setState(update);
  }
}
