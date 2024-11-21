import { toUtc, dateMath } from '@grafana/data';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { PanelBuilders } from './PanelBuilders';
import { SceneTimeRange } from './SceneTimeRange';
import { RefreshEvent } from '@grafana/runtime';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneReactObject } from '../components/SceneReactObject';

jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
}));

function simulateDelay(newDateString: string, scene: EmbeddedScene) {
  jest.setSystemTime(new Date(newDateString));
  scene.activate();
}

describe('SceneTimeRange', () => {
  it('when created should evaluate time range', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    expect(timeRange.state.value.raw.from).toBe('now-1h');
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
      timezone: 'browser',
    });
  });

  it('updateFromUrl with ISO time', () => {
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    timeRange.urlSync?.updateFromUrl({
      from: '2021-01-01T10:00:00.000Z',
      to: '2021-02-03T01:20:00.000Z',
      timezone: 'browser',
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
        expect(timeRange.getTimeZone()).toBe('browser');
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
      expect(timeRange.state.value.to).toEqual(dateMath.parse('now-1m', true));
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

      expect(stateSpy).toBeCalledTimes(1);
      expect(stateSpy).toBeCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            to: dateMath.parse('now-1m', true),
            raw: expect.objectContaining({
              to: 'now',
            }),
          }),
        })
      );
    });

    it('should apply the delay to the value when time range refreshed', async () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', UNSAFE_nowDelay: '1m' });
      timeRange.onRefresh();
      expect(timeRange.state.value.to).toEqual(dateMath.parse('now-1m', true));
      expect(timeRange.state.value.raw.to).toBe('now');
    });

    it('should apply the delay to the value when updating from URL', async () => {
      const timeRange = new SceneTimeRange({ from: 'now-30s', to: 'now', UNSAFE_nowDelay: '1m' });

      timeRange.urlSync?.updateFromUrl({
        from: 'now-6h',
        to: 'now',
      });

      expect(timeRange.state.value.raw.to).toBe('now');
      expect(timeRange.state.value.to).toEqual(dateMath.parse('now-1m', true));
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
      expect(innerTimeRange.state.value.to).toEqual(dateMath.parse('now-1m', true));
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
  });
});
