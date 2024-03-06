import { VizPanel } from "../components/VizPanel/VizPanel";
import { SceneObjectBase } from "../core/SceneObjectBase";
import { sceneGraph } from "../core/sceneGraph";
import { SceneObjectState } from "../core/types";

export class LiveNowTimer extends SceneObjectBase<SceneObjectState> {
    private timerId: number | undefined = undefined;
    private static REFRESH_RATE = 100; // ms
    private enabled = false;
  
    public constructor(enabled = false) {
      super({});
      this.addActivationHandler(this._activationHandler);
  
      if (enabled) {
        this.enable();
      }
    }
  
    private _activationHandler = () => {
      return () => {
        window.clearInterval(this.timerId);
        this.timerId = undefined;
      }
    }
  
    public enable() {
      if (!this.enabled) {
        this.enabled = true;
        this.timerId = window.setInterval(() => {
          const panels = sceneGraph.findAllObjects(this.getRoot(), (obj) => obj instanceof VizPanel) as VizPanel[];
          for (const panel of panels) {
            panel.forceRender();
          }
        }, LiveNowTimer.REFRESH_RATE);
      }
    } 
  
    public disable() {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
      this.enabled = false;
    }

    public get isEnabled() {
        return this.enabled;
    }
}
