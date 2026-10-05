import { VizPanel } from '../components/VizPanel/VizPanel';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectState } from '../core/types';

interface LiveNowTimerState extends SceneObjectState {
  enabled: boolean;
  refreshRate?: number;
}

export class LiveNowTimer extends SceneObjectBase<LiveNowTimerState> {
  private timerId: number | undefined = undefined;
  public static DEFAULT_REFRESH_RATE = 100; // ms

  public constructor({ enabled = false, refreshRate }: { enabled?: boolean; refreshRate?: number } = {}) {
    super({ enabled, refreshRate });
    this.addActivationHandler(this._activationHandler);
  }

  private _activationHandler = () => {
    if (this.state.enabled) {
      this.enable();
    }

    return () => {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    };
  };

  public enable() {
    window.clearInterval(this.timerId);
    this.timerId = undefined;
    this.timerId = window.setInterval(() => {
      const panels = sceneGraph.findAllObjects(this.getRoot(), (obj) => obj instanceof VizPanel) as VizPanel[];
      for (const panel of panels) {
        panel.forceRender();
      }
    }, this.state.refreshRate ?? LiveNowTimer.DEFAULT_REFRESH_RATE);
    this.setState({ enabled: true });
  }

  public disable() {
    window.clearInterval(this.timerId);
    this.timerId = undefined;
    this.setState({ enabled: false });
  }

  public setRefreshRate(refreshRate: number) {
    this.setState({ refreshRate });
    if (this.state.enabled) {
      this.enable();
    }
  }

  public get isEnabled() {
    return this.state.enabled;
  }
}
