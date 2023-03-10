import { dateTime } from '@grafana/data';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneFlexLayout } from './layout/SceneFlexLayout';
import { SceneRefreshPicker } from './SceneRefreshPicker';

function setupScene(refresh: string, intervals?: string[]) {
  const timeRange = new SceneTimeRange({});
  const refreshPicker = new SceneRefreshPicker({
    refresh,
    intervals,
  });

  const scene = new SceneFlexLayout({
    $timeRange: timeRange,
    children: [refreshPicker],
  });

  scene.activate();
  // activating picker automatically as we do not render scene in the test
  refreshPicker.activate();

  return { refreshPicker, timeRange };
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
    const { refreshPicker, timeRange } = setupScene('5s');

    const t1 = timeRange.state.value;

    jest.advanceTimersByTime(5000);

    const t2 = timeRange.state.value;

    expect(dateTime(t2.from).diff(t1.from, 's')).toBe(5);
    expect(dateTime(t2.to).diff(t1.to, 's')).toBe(5);

    jest.advanceTimersByTime(2000);

    refreshPicker.deactivate();

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
});
