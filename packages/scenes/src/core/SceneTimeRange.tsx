import { getTimeZone, rangeUtil, setWeekStart, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneTimeRangeLike, SceneTimeRangeState, SceneObjectUrlValues } from './types';
import { getClosest } from './sceneGraph/utils';
import { parseUrlParam } from '../utils/parseUrlParam';
import { evaluateTimeRange } from '../utils/evaluateTimeRange';
import { config, RefreshEvent } from '@grafana/runtime';

export class SceneTimeRange extends SceneObjectBase<SceneTimeRangeState> implements SceneTimeRangeLike {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['from', 'to', 'timezone'] });

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

    if (this.state.weekStart) {
      setWeekStart(this.state.weekStart);
    }

    if (rangeUtil.isRelativeTimeRange(this.state.value.raw)) {
      this.refreshIfStale();
    }

    // Deactivation handler that restore weekStart if it was changed
    return () => {
      if (this.state.weekStart) {
        setWeekStart(config.bootData.user.weekStart);
      }
    };
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
      this.setState(update);
    }
  };

  public onTimeZoneChange = (timeZone: TimeZone) => {
    this.setState({ timeZone });
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
    const urlValues: SceneObjectUrlValues = { from: this.state.from, to: this.state.to };
    if (this.state.timeZone) {
      urlValues.timezone = this.state.timeZone;
    }

    return urlValues;
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
