import { EmbeddedScene } from '../components/EmbeddedScene';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { LiveNowTimer } from './LiveNowTimer';

jest.useFakeTimers();
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');

describe('LiveNowTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])('should initialize the state correctly to %s', (enabled) => {
    const { timer } = setup({ enabled });

    expect(timer.isEnabled).toBe(enabled);
  });

  it('should enable the timer', () => {
    const { timer } = setup({ enabled: false });

    timer.enable();
    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(timer.isEnabled).toBe(true);
  });

  it('should disable the timer', () => {
    const { timer } = setup({ enabled: true });

    timer.disable();
    expect(timer.isEnabled).toBe(false);
    expect(clearInterval).toHaveBeenCalledTimes(1);
  });

  it('should force render all VizPanels', () => {
    const { timer } = setup({ enabled: false });

    jest.runOnlyPendingTimers();

    timer.enable();

    expect(VizPanel.prototype.forceRender).toHaveBeenCalledTimes(2);
  });

  it('should restart the interval with the new rate when enabled', () => {
    const { timer } = setup({ enabled: false });
    timer.enable();

    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), LiveNowTimer.DEFAULT_REFRESH_RATE);

    timer.setRefreshRate(500);

    expect(clearInterval).toHaveBeenCalledTimes(2);
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 500);
    expect(timer.isEnabled).toBe(true);
  });

  it('should not enable a disabled timer when setRefreshRate is called', () => {
    const { timer } = setup({ enabled: false });

    timer.setRefreshRate(500);

    expect(setInterval).not.toHaveBeenCalled();
    expect(timer.isEnabled).toBe(false);
  });

  it('should use the updated refresh rate the next time enable is called', () => {
    const { timer } = setup({ enabled: false });

    timer.setRefreshRate(500);
    timer.enable();

    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 500);
  });
});

function setup({ enabled = true } = {}) {
  const timer = new LiveNowTimer({ enabled });

  jest.spyOn(VizPanel.prototype, 'forceRender');

  const scene = new EmbeddedScene({
    $behaviors: [timer],
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: new VizPanel({}),
        }),
        new SceneFlexItem({
          body: new VizPanel({}),
        }),
      ],
    }),
  });

  return { scene, timer };
}
