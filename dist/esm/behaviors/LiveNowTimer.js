import { VizPanel } from '../components/VizPanel/VizPanel.js';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';

const _LiveNowTimer = class extends SceneObjectBase {
  constructor({ enabled = false }) {
    super({ enabled });
    this.timerId = void 0;
    this._activationHandler = () => {
      if (this.state.enabled) {
        this.enable();
      }
      return () => {
        window.clearInterval(this.timerId);
        this.timerId = void 0;
      };
    };
    this.addActivationHandler(this._activationHandler);
  }
  enable() {
    window.clearInterval(this.timerId);
    this.timerId = void 0;
    this.timerId = window.setInterval(() => {
      const panels = sceneGraph.findAllObjects(this.getRoot(), (obj) => obj instanceof VizPanel);
      for (const panel of panels) {
        panel.forceRender();
      }
    }, _LiveNowTimer.REFRESH_RATE);
    this.setState({ enabled: true });
  }
  disable() {
    window.clearInterval(this.timerId);
    this.timerId = void 0;
    this.setState({ enabled: false });
  }
  get isEnabled() {
    return this.state.enabled;
  }
};
let LiveNowTimer = _LiveNowTimer;
LiveNowTimer.REFRESH_RATE = 100;

export { LiveNowTimer };
//# sourceMappingURL=LiveNowTimer.js.map
