import { toUtc, dateMath, InternalTimeZones } from '@grafana/data';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { PanelBuilders } from './PanelBuilders';
import { SceneTimeRange } from './SceneTimeRange';
import { RefreshEvent, config } from '@grafana/runtime';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneReactObject } from '../components/SceneReactObject';
import { defaultTimeZone as browserTimeZone } from '@grafana/schema';

function simulateDelay(newDateString: string, scene: EmbeddedScene) {
  jest.setSystemTime(new Date(newDateString));
  scene.activate();
}

const USER_PROFILE_DEFAULT_TIME_ZONE = 'Australia/Sydney';

config.bootData = { user: { weekStart: 'monday', timezone: USER_PROFILE_DEFAULT_TIME_ZONE } } as any;

describe('SceneTimeRange', () => {
  it('when created should evaluate time range', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    expect(timeRange.state.value.raw.from).toBe('now-1h');
  });

  it('When weekStart use it when evaluting time range', () => {
    const timeRange = new SceneTimeRange({ from: 'now/w', to: 'now/w', weekStart: 'saturday' });
    const weekDay = timeRange.state.value.from.isoWeekday();

    expect(weekDay).toBe(6);
  });

  it('when time range refreshed should evaluate and update value', async () => {
    const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now' });
    const startTime = timeRange.state.value.from.valueOf();
    await new Promise((r) => setTimeout(r, 2));
    timeRange.onRefresh();
    const diff = timeRange.state.value.from.valueOf() - startTime;
    expect(diff).toBeGreaterThan(0);
  });

  it('when time range refreshed should trigger refresh event', async () => {
    const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now' });
    const spy = jest.spyOn(timeRange, 'publishEvent');

    timeRange.onRefresh();

    expect(spy).toHaveBeenCalledTimes(2);
    // The first call is a set state event, the second is the refresh event
    expect(spy.mock.calls[1][0]).toBeInstanceOf(RefreshEvent);
    expect(spy.mock.calls[1][1]).toBe(true);
    expect(spy).toHaveBeenCalledWith(expect.any(RefreshEvent), true);
  });

  it('toUrlValues with relative range', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    expect(timeRange.urlSync?.getUrlState()).toEqual({
      from: 'now-1h',
      to: 'now',
      timezone: browserTimeZone,
    });
  });

  it('updateFromUrl with ISO time', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({
      from: '2021-01-01T10:00:00.000Z',
      to: '2021-02-03T01:20:00.000Z',
      timezone: USER_PROFILE_DEFAULT_TIME_ZONE,
    });

    expect(timeRange.state.from).toEqual('2021-01-01T10:00:00.000Z');
    expect(timeRange.state.value.from.valueOf()).toEqual(1609495200000);
  });

  it('updateFromUrl with time and time window using ms', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({
      from: '2021-01-01T10:00:00.000Z',
      to: '2021-02-03T01:20:00.000Z',
      time: '1500000000000', // 2017-07-14T02:40:00.000Z
      'time.window': '10000', // 10s
    });

    // 2017-07-14T02:40:00.000Z - 5s
    expect(timeRange.state.from).toEqual('2017-07-14T02:39:55.000Z');
    // 2017-07-14T02:40:00.000Z + 5s
    expect(timeRange.state.to).toEqual('2017-07-14T02:40:05.000Z');
  });

  it('updateFromUrl with time and time window using ISO', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({
      from: '2021-01-01T10:00:00.000Z',
      to: '2021-02-03T01:20:00.000Z',
      time: '2017-07-14T02:40:00.000Z', // 2017-07-14T02:40:00.000Z
      'time.window': '10000', // 10s
    });

    // 2017-07-14T02:40:00.000Z - 5s
    expect(timeRange.state.from).toEqual('2017-07-14T02:39:55.000Z');
    // 2017-07-14T02:40:00.000Z + 5s
    expect(timeRange.state.to).toEqual('2017-07-14T02:40:05.000Z');
  });

  it('should not update state when time range is not changed', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    const stateSpy = jest.spyOn(timeRange, 'setState');

    timeRange.onTimeRangeChange({
      from: toUtc('2020-01-01'),
      to: toUtc('2020-01-02'),
      raw: { from: toUtc('2020-01-01'), to: toUtc('2020-01-02') },
    });
    expect(stateSpy).toBeCalledTimes(1);

    timeRange.onTimeRangeChange({
      from: toUtc('2020-01-01'),
      to: toUtc('2020-01-02'),
      raw: { from: toUtc('2020-01-01'), to: toUtc('2020-01-02') },
    });
    expect(stateSpy).toBeCalledTimes(1);
  });

  it('should not allow invalid date values', () => {
    const invalidDate = 'now)';
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: invalidDate });
    expect(timeRange.state.value.raw.to).toBe('now');
  });

  it('should not allow invalid date values when updating from URL', () => {
    let invalidDate = 'now)';
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({ to: invalidDate });
    expect(timeRange.state.value.raw.to).toBe('now');
  });

  describe('time zones', () => {
    describe('when time zone is not specified', () => {
      it('should return default time zone', () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
        expect(timeRange.getTimeZone()).toBe(browserTimeZone);
      });
      it('should return time zone of the closest range with time zone specified ', () => {
        const outerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        const innerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
        const scene = new SceneFlexLayout({
          $timeRange: outerTimeRange,
          children: [
            new SceneFlexItem({
              $timeRange: innerTimeRange,
              body: PanelBuilders.text().build(),
            }),
          ],
        });
        scene.activate();
        expect(innerTimeRange.getTimeZone()).toEqual(outerTimeRange.getTimeZone());
      });
    });
    describe('when user selects default time zone', () => {
      it(`should return default time zone set in user profile settings`, () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
        timeRange.onTimeZoneChange(InternalTimeZones.default);
        expect(timeRange.getTimeZone()).toBe(USER_PROFILE_DEFAULT_TIME_ZONE);
      });
    });
    describe('when time zone is specified', () => {
      it('should return own time zone', () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        expect(timeRange.getTimeZone()).toBe('America/New_York');
      });
      it('should return own time zone ignoring of the outer range', () => {
        const outerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
        const innerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'Europe/Berlin' });
        const scene = new SceneFlexLayout({
          $timeRange: outerTimeRange,
          children: [
            new SceneFlexItem({
              $timeRange: innerTimeRange,
              body: PanelBuilders.text().build(),
            }),
          ],
        });
        scene.activate();
        expect(innerTimeRange.getTimeZone()).toEqual('Europe/Berlin');
      });

      it('should update time zone when updating from URL', () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'utc' });
        timeRange.urlSync?.updateFromUrl({ from: 'now-1h', to: 'now', timezone: 'America/New_York' });
        expect(timeRange.getTimeZone()).toBe('America/New_York');
        timeRange.urlSync?.updateFromUrl({ from: 'now-1h', to: 'now', timezone: 'utc' });
        expect(timeRange.getTimeZone()).toBe('utc');
      });
    });
    describe('when time zone is not valid', () => {
      it(`should default to ${browserTimeZone}`, () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'junk' });
        expect(timeRange.getTimeZone()).toBe(browserTimeZone);

        timeRange.onTimeZoneChange('junk');
        expect(timeRange.getTimeZone()).toBe(browserTimeZone);
      });
      it(`should default to ${browserTimeZone} on update`, () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'utc' });
        expect(timeRange.getTimeZone()).toBe('utc');

        timeRange.onTimeZoneChange('junk');
        expect(timeRange.getTimeZone()).toBe(browserTimeZone);
      });
    });
  });

  describe('delay now', () => {
    const mockedNow = '2021-01-01T10:00:00.000Z';
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(mockedNow));
    });

    it('when created should evaluate time range applying the delay value to now', () => {
      const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', UNSAFE_nowDelay: '1m' });
      expect(timeRange.state.value.raw.from).toBe('now-1h');
      expect(timeRange.state.value.raw.to).toBe('now');
      expect(timeRange.state.value.to.isSame(dateMath.toDateTime('now-1m', { roundUp: true }))).toBeTruthy();
    });

    it('should NOT apply the delay value to absolute time range', () => {
      const timeRange = new SceneTimeRange({
        from: '2021-01-01T10:00:00.000Z',
        to: '2021-02-03T01:20:00.000Z',
        UNSAFE_nowDelay: '1m',
      });
      expect(timeRange.state.value.to).toEqual(dateMath.parse('2021-02-03T01:20:00.000Z'));
      expect(timeRange.state.value.from).toEqual(dateMath.parse('2021-01-01T10:00:00.000Z'));
      expect(timeRange.state.value.raw.from).toEqual('2021-01-01T10:00:00.000Z');
      expect(timeRange.state.value.raw.to).toEqual('2021-02-03T01:20:00.000Z');
    });

    it('should apply delay after time range changes', () => {
      const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', UNSAFE_nowDelay: '1m' });
      const stateSpy = jest.spyOn(timeRange, 'setState');

      timeRange.onTimeRangeChange({
        from: toUtc('2020-01-01'),
        to: toUtc(),
        raw: { from: toUtc('2020-01-01'), to: 'now' },
      });

      expect(stateSpy).toHaveBeenCalledTimes(1);

      expect(stateSpy.mock.calls[0][0].value?.to.isSame(dateMath.toDateTime('now-1m', { roundUp: true }))).toBeTruthy();
      expect(stateSpy.mock.calls[0][0].value?.raw.to).toEqual('now');
    });

    it('should apply the delay to the value when time range refreshed', async () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', UNSAFE_nowDelay: '1m' });
      timeRange.onRefresh();
      expect(timeRange.state.value.to.isSame(dateMath.toDateTime('now-1m', { roundUp: true }))).toBeTruthy();
      expect(timeRange.state.value.raw.to).toBe('now');
    });

    it('should apply the delay to the value when updating from URL', async () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', UNSAFE_nowDelay: '1m' });

      timeRange.urlSync?.updateFromUrl({
        from: 'now-6h',
        to: 'now',
      });

      expect(timeRange.state.value.raw.to).toBe('now');
      expect(timeRange.state.value.to.isSame(dateMath.toDateTime('now-1m', { roundUp: true }))).toBeTruthy();
    });

    it('should apply delay when updating time zone from the closest range with time zone specified', () => {
      const outerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', timeZone: 'America/New_York' });
      const innerTimeRange = new SceneTimeRange({ from: 'now-1h', to: 'now', UNSAFE_nowDelay: '1m' });
      const scene = new SceneFlexLayout({
        $timeRange: outerTimeRange,
        children: [
          new SceneFlexItem({
            $timeRange: innerTimeRange,
            body: PanelBuilders.text().build(),
          }),
        ],
      });
      scene.activate();

      expect(innerTimeRange.state.value.raw.to).toBe('now');
      expect(innerTimeRange.state.value.to.isSame(dateMath.toDateTime('now-1m', { roundUp: true }))).toBeTruthy();
    });
  });

  describe('timerange invalidation', () => {
    const mockedNow = '2021-01-01T10:00:00.000Z';
    const mocked100MsLater = '2021-01-01T10:00:00.100Z';
    const mocked10sLater = '2021-01-01T10:00:10.000Z';
    const mockedHourLater = '2021-01-01T11:00:00.000Z';

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(mockedNow));
    });

    it('should NOT invalidate stale time range that does not meet refresh threshold', () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', refreshOnActivate: {} });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mockedHourLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
    });

    it('should invalidate stale time range by default', () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now' });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mockedHourLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedHourLater);
    });

    it('should NOT invalidate stale time range before refresh duration has elapsed', () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', refreshOnActivate: { afterMs: 101 } });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mocked100MsLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
    });

    it('should NOT invalidate stale time range with percent when refresh threshold is not met', () => {
      const timeRange = new SceneTimeRange({
        from: 'now-30s',
        to: 'now',
        refreshOnActivate: { afterMs: 60000, percent: 10 },
      });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mocked100MsLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
    });

    it('should invalidate stale time range when refresh threshold is met', () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', refreshOnActivate: { afterMs: 100 } });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mocked100MsLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mocked100MsLater);
    });

    it('should invalidate stale time range when either refresh threshold is met', () => {
      const timeRange = new SceneTimeRange({
        from: 'now-30s',
        to: 'now',
        refreshOnActivate: { afterMs: 60000, percent: 10 },
      });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mocked10sLater, scene);
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mocked10sLater);
    });

    it('should invalidate stale time range with custom percent', () => {
      const timeRange = new SceneTimeRange({
        from: 'now-10m',
        to: 'now',
        refreshOnActivate: { percent: 1 },
      });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneReactObject({}),
      });

      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mockedNow);
      simulateDelay(mocked10sLater, scene);
      // Should be stale since 1% of 10m is 6s
      expect(scene.state.$timeRange?.state.value.to.utc().toISOString()).toEqual(mocked10sLater);
    });
  });

  describe('Time zone change to Africa/Addis_Ababa', () => {
    it('should display the correct start time in the time start panel and time picker tooltip', () => {
      const timeRange = new SceneTimeRange({ from: '2025-01-01T00:00:00.000Z', to: '2025-12-31T23:59:59.999Z' });
      timeRange.onTimeZoneChange('Africa/Addis_Ababa');

      expect(timeRange.getTimeZone()).toBe('Africa/Addis_Ababa');

      // Verify the stored start time is correct (assert in UTC for deterministic test)
      expect(timeRange.state.value.from.utc().format('YYYY-MM-DD HH:mm:ss')).toBe('2025-01-01 00:00:00');

      // Verify the time picker tooltip reads the correct start time (UTC)
      const tooltipStartTime = timeRange.state.value.from.utc().format('HH:mm:ss');
      expect(tooltipStartTime).toBe('00:00:00');
    });
  });
});
