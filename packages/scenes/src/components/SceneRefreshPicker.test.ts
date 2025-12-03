import { dateTime, rangeUtil } from '@grafana/data';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';
import { SceneRefreshPicker } from './SceneRefreshPicker';
import { RefreshPicker } from '@grafana/ui';
import { config } from '@grafana/runtime';

jest.mock('@grafana/data', () => {
  const originalModule = jest.requireActual('@grafana/data');

  return {
    __esModule: true,
    ...originalModule,
    rangeUtil: {
      ...originalModule.rangeUtil,
      calculateInterval: jest.fn(),
    },
  };
});

function setupScene(
  refresh: string,
  intervals?: string[],
  autoEnabled?: boolean,
  autoInterval = 20000,
  minRefreshInterval?: string
) {
  // We need to mock this on every run otherwise we can't rely on the spy value
  const calculateIntervalSpy = jest.fn(() => ({ interval: `${autoInterval / 1000}s`, intervalMs: autoInterval }));

  rangeUtil.calculateInterval = calculateIntervalSpy;

  const timeRange = new SceneTimeRange({});
  const refreshPicker = new SceneRefreshPicker({
    autoEnabled,
    refresh,
    intervals,
    autoMinInterval: '20s',
    minRefreshInterval,
  });

  const scene = new SceneFlexLayout({
    $timeRange: timeRange,
    children: [new SceneFlexItem({ body: refreshPicker })],
  });

  scene.activate();

  // activating picker automatically as we do not render scene in the test
  const deactivateRefreshPicker = refreshPicker.activate();

  return { refreshPicker, timeRange, deactivateRefreshPicker, calculateIntervalSpy };
}

describe('SceneRefreshPicker', () => {
  beforeAll(() => {
    jest
      .useFakeTimers({
        doNotFake: ['setTimeout'],
      })
      .setSystemTime(new Date('2023-01-01'));
  });

  it('updates time range on provided interval', async () => {
    const { timeRange } = setupScene('5s');
    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(5000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(5);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(5);
  });

  it('does not update time range on provided interval if tab not visible', async () => {
    const { timeRange } = setupScene('5s');

    const onRefreshMock = jest.spyOn(timeRange, 'onRefresh');
    const isTabVisibleMock = jest.spyOn(SceneRefreshPicker.prototype as any, 'isTabVisible');
    isTabVisibleMock.mockReturnValue(false);

    jest.advanceTimersByTime(5000);

    expect(onRefreshMock).not.toHaveBeenCalled();

    isTabVisibleMock.mockReturnValue(true);

    jest.advanceTimersByTime(5000);

    expect(onRefreshMock).toHaveBeenCalled();
  });

  it('allows interval clearing', async () => {
    const { refreshPicker, timeRange } = setupScene('5s');

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(5000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(5);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(5);

    refreshPicker.onIntervalChanged('');

    jest.advanceTimersByTime(5000);

    const t3 = timeRange.state.value;
    expect(dateTime(t3.from).diff(t2.from, 's')).toBe(0);
    expect(dateTime(t3.to).diff(t2.to, 's')).toBe(0);
  });

  it('does not update time range with invalid interval', async () => {
    const { timeRange } = setupScene('1s');

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(1000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(0);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(0);
  });

  it('allows available intervals customisation', async () => {
    const { timeRange } = setupScene('1s', ['1s', '1m']);

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(1000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(1);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(1);
  });

  it('cancels refresh on deactivation', async () => {
    const { timeRange, deactivateRefreshPicker } = setupScene('5s');

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(5000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(5);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(5);

    jest.advanceTimersByTime(2000);

    deactivateRefreshPicker();

    jest.advanceTimersByTime(3000);

    const t3 = timeRange.state.value;
    expect(dateTime(t3.from).diff(t2.from, 's')).toBe(0);
    expect(dateTime(t3.to).diff(t2.to, 's')).toBe(0);
  });

  it('resets refresh on interval change', async () => {
    const { refreshPicker, timeRange } = setupScene('5s');

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(5000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(5);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(5);

    // +2s
    jest.advanceTimersByTime(2000);

    refreshPicker.onIntervalChanged('10s');
    const t3 = timeRange.state.value;

    //+3s
    jest.advanceTimersByTime(3000);

    expect(dateTime(t3.from).diff(t2.from, 's')).toBe(0);
    expect(dateTime(t3.to).diff(t2.to, 's')).toBe(0);

    // +7s
    jest.advanceTimersByTime(7000);
    const t4 = timeRange.state.value;

    expect(dateTime(t4.from).diff(t3.from, 's')).toBe(12);
    expect(dateTime(t4.to).diff(t3.to, 's')).toBe(12);
  });

  describe('Url sync', () => {
    it('Should not return url state when refresh is empty string', () => {
      const { refreshPicker } = setupScene('');
      expect(refreshPicker.getUrlState()).toEqual({ refresh: undefined });
    });

    it('Should not return url state when refresh is boolean', () => {
      // @ts-ignore
      const { refreshPicker } = setupScene(false);
      expect(refreshPicker.getUrlState()).toEqual({ refresh: undefined });
    });

    it('Should not return url state when refresh is interval string', () => {
      // @ts-ignore
      const { refreshPicker } = setupScene('11s');
      expect(refreshPicker.getUrlState()).toEqual({ refresh: '11s' });
    });

    it('Should not update url with invalid refresh', () => {
      const { refreshPicker } = setupScene('');
      refreshPicker.updateFromUrl({ refresh: 'true' });
      expect(refreshPicker.state.refresh).toEqual('');
    });
  });

  describe('min interval config', () => {
    beforeAll(() => {
      config.minRefreshInterval = '30s';
    });
    afterAll(() => {
      config.minRefreshInterval = '';
    });

    it('does not include unallowed intervals', () => {
      const { refreshPicker } = setupScene('5s', ['5s', '30s', '1m']);
      expect(refreshPicker.state.intervals).not.toContain('5s');
    });

    it('does not set interval to unallowed interval', () => {
      const { timeRange } = setupScene('5s', ['5s', '30s', '1m']);
      const t1 = timeRange.state.value;
      jest.advanceTimersByTime(10000);

      expect(dateTime(t1.from)).toEqual(dateTime(timeRange.state.value.from));
    });

    it('sets the interval to the smallest allowed interval when invalid interval is less than all allowed intervals', () => {
      const { refreshPicker } = setupScene('', ['5s', '30s', '1m']);
      refreshPicker.updateFromUrl({ refresh: '3s' });
      expect(refreshPicker.state.refresh).toBe('5s');
    });

    it('sets the interval by rounding down to the highest allowed interval <= invalid interval', () => {
      const { refreshPicker } = setupScene('', ['10s', '30s', '1m', '5m']);
      refreshPicker.updateFromUrl({ refresh: '25s' });
      expect(refreshPicker.state.refresh).toBe('10s');
    });

    it('sets the interval to the highest allowed interval when invalid interval is higher than all allowed intervals', () => {
      const { refreshPicker } = setupScene('', ['10s', '30s', '1m', '5m']);
      refreshPicker.updateFromUrl({ refresh: '5h' });
      expect(refreshPicker.state.refresh).toBe('5m');
    });

    it('can let min config interval to be overriden', () => {
      const { refreshPicker } = setupScene('5s', ['5s', '10s', '30s', '1m'], undefined, undefined, '10s');
      expect(refreshPicker.state.intervals).not.toContain('5s');
      expect(refreshPicker.state.intervals).toContain('10s');
    });

    it('can let min config interval to be overriden to 0', () => {
      const { refreshPicker } = setupScene('5s', ['5s', '30s', '1m'], undefined, undefined, '0ms');
      expect(refreshPicker.state.intervals).toContain('5s');
    });

    it('does not crash if refresh interval is set to empty string', () => {
      const { refreshPicker } = setupScene('5s', [''], undefined, undefined, '10s');
      expect(refreshPicker.state.intervals).toEqual([]);
    });
  });

  describe('auto interval', () => {
    it('includes auto interval in options by default', () => {
      const { refreshPicker } = setupScene('5s', undefined, undefined);
      expect(refreshPicker.state.autoEnabled).toBe(true);
    });

    it('does not include auto interval in options when disabled', () => {
      const { refreshPicker } = setupScene('5s', undefined, false);
      expect(refreshPicker.state.autoEnabled).toBe(false);
    });

    it('recalculates auto interval when time range changes and auto is selected', () => {
      const { timeRange, calculateIntervalSpy } = setupScene(RefreshPicker.autoOption.value);

      // The initial calculation
      expect(calculateIntervalSpy).toHaveBeenCalledTimes(1);

      // The time range changes
      timeRange.setState({ from: 'now-30d', to: 'now-15d' });
      timeRange.onRefresh();

      // The interval is recalculated
      expect(calculateIntervalSpy).toHaveBeenCalledTimes(2);
    });

    it('does not recalculate auto interval when time range changes and auto is not selected', () => {
      const { timeRange, calculateIntervalSpy } = setupScene('5s');
      timeRange.setState({ from: 'now-30d', to: 'now-29d' });
      timeRange.onRefresh();
      expect(calculateIntervalSpy).not.toHaveBeenCalled();
    });

    it('does not recalculate auto interval when a tick happens', () => {
      const autoInterval = 20000;
      const { calculateIntervalSpy } = setupScene(RefreshPicker.autoOption.value, undefined, true, autoInterval);

      // The initial calculation
      expect(calculateIntervalSpy).toHaveBeenCalledTimes(1);

      // A refresh triggers
      jest.advanceTimersByTime(autoInterval);

      // There is no additional calculation
      expect(calculateIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });
});
