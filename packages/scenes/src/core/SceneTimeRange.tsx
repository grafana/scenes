import { getTimeZone, rangeUtil, TimeRange, toUtc } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneTimeRangeLike, SceneTimeRangeState, SceneObjectUrlValues } from './types';
import { getClosest } from './sceneGraph/utils';
import { parseUrlParam } from '../utils/parseUrlParam';
import { evaluateTimeRange } from '../utils/evaluateTimeRange';
import { locationService, RefreshEvent } from '@grafana/runtime';

export class SceneTimeRange extends SceneObjectBase<SceneTimeRangeState> implements SceneTimeRangeLike {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['from', 'to', 'timezone', 'time', 'time.window'] });

  public constructor(state: Partial<SceneTimeRangeState> = {}) {
    const from = state.from ?? 'now-6h';
    const to = state.to ?? 'now';
    const timeZone = state.timeZone;
    const value = evaluateTimeRange(
      from,
      to,
      timeZone || getTimeZone(),
      state.fiscalYearStartMonth,
      state.UNSAFE_nowDelay
    );
    const refreshOnActivate = state.refreshOnActivate ?? { percent: 10 };
    super({ from, to, timeZone, value, refreshOnActivate, ...state });

    this.addActivationHandler(this._onActivate.bind(this));
  }

  private _onActivate() {
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
                  this.state.fiscalYearStartMonth,
                  this.state.UNSAFE_nowDelay
                ),
              });
            }
          })
        );
      }
    }

    if (rangeUtil.isRelativeTimeRange(this.state.value.raw)) {
      this.refreshIfStale();
    }
  }

  private refreshIfStale() {
    let ms;
    if (this.state?.refreshOnActivate?.percent !== undefined) {
      ms = this.calculatePercentOfInterval(this.state.refreshOnActivate.percent);
    }
    if (this.state?.refreshOnActivate?.afterMs !== undefined) {
      ms = Math.min(this.state.refreshOnActivate.afterMs, ms ?? Infinity);
    }
    if (ms !== undefined) {
      this.refreshRange(ms);
    }
  }

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

  /**
   * Refreshes time range if it is older than the invalidation interval
   * @param refreshAfterMs invalidation interval (milliseconds)
   * @private
   */
  private refreshRange(refreshAfterMs: number) {
    const value = evaluateTimeRange(
      this.state.from,
      this.state.to,
      this.state.timeZone ?? getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );

    const diff = value.to.diff(this.state.value.to, 'milliseconds');
    if (diff >= refreshAfterMs) {
      this.setState({
        value,
      });
    }
  }

  private calculatePercentOfInterval(percent: number): number {
    const intervalMs = this.state.value.to.diff(this.state.value.from, 'milliseconds');
    return Math.ceil(intervalMs / percent);
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

    update.value = evaluateTimeRange(
      update.from,
      update.to,
      this.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );

    // Only update if time range actually changed
    if (update.from !== this.state.from || update.to !== this.state.to) {
      this._urlSync.performBrowserHistoryAction(() => {
        this.setState(update);
      });
    }
  };

  public onTimeZoneChange = (timeZone: TimeZone) => {
    this._urlSync.performBrowserHistoryAction(() => {
      this.setState({ timeZone });
    });
  };

  public onRefresh = () => {
    this.setState({
      value: evaluateTimeRange(
        this.state.from,
        this.state.to,
        this.getTimeZone(),
        this.state.fiscalYearStartMonth,
        this.state.UNSAFE_nowDelay
      ),
    });

    this.publishEvent(new RefreshEvent(), true);
  };

  public getUrlState() {
    const params = locationService.getSearchObject();
    const urlValues: SceneObjectUrlValues = { from: this.state.from, to: this.state.to };

    if (this.state.timeZone) {
      urlValues.timezone = this.state.timeZone;
    }

    // Clear time and time.window once they are converted to from and to
    if (params.time && params['time.window']) {
      urlValues.time = null;
      urlValues['time.window'] = null;
    }

    return urlValues;
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const update: Partial<SceneTimeRangeState> = {};

    let from = parseUrlParam(values.from);
    let to = parseUrlParam(values.to);

    if (values.time && values['time.window']) {
      const time = Array.isArray(values.time) ? values.time[0] : values.time;
      const timeWindow = Array.isArray(values['time.window']) ? values['time.window'][0] : values['time.window'];
      const timeRange = getTimeWindow(time, timeWindow);
      from = timeRange.from;
      to = timeRange.to;
    }

    if (!from && !to) {
      return;
    }

    if (from) {
      update.from = from;
    }

    if (to) {
      update.to = to;
    }

    if (typeof values.timezone === 'string') {
      update.timeZone = values.timezone !== '' ? values.timezone : undefined;
    }

    update.value = evaluateTimeRange(
      update.from ?? this.state.from,
      update.to ?? this.state.to,
      update.timeZone ?? this.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );

    this.setState(update);
  }
}

/**
 * Calculates the duration of the time range from time-time.window/2 to time+time.window/2. Both be specified in ms. For example ?time=1500000000000&time.window=10000 results in a 10-second time range from 1499999995000 to 1500000005000`.
 * @param time - time in ms
 * @param timeWindow - time window in ms or interval string
 */
function getTimeWindow(time: string, timeWindow: string) {
  // Parse the time, assuming it could be an ISO string or a number in milliseconds
  const valueTime = isNaN(Date.parse(time)) ? parseInt(time, 10) : Date.parse(time);

  let timeWindowMs;

  if (timeWindow.match(/^\d+$/) && parseInt(timeWindow, 10)) {
    // when time window is specified in ms
    timeWindowMs = parseInt(timeWindow, 10);
  } else {
    timeWindowMs = rangeUtil.intervalToMs(timeWindow);
  }

  return {
    from: toUtc(valueTime - timeWindowMs / 2).toISOString(),
    to: toUtc(valueTime + timeWindowMs / 2).toISOString(),
  };
}
