import { sceneGraph } from './sceneGraph/index.js';
import { SceneObjectBase } from './SceneObjectBase.js';

class SceneTimeRangeTransformerBase extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._activationHandler = () => {
      const ancestorTimeRange = this.getAncestorTimeRange();
      this.ancestorTimeRangeChanged(ancestorTimeRange.state);
      this._subs.add(ancestorTimeRange.subscribeToState((s) => this.ancestorTimeRangeChanged(s)));
    };
    this.addActivationHandler(this._activationHandler);
  }
  getAncestorTimeRange() {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + " must be used within $timeRange scope");
    }
    return sceneGraph.getTimeRange(this.parent.parent);
  }
  getTimeZone() {
    return this.getAncestorTimeRange().getTimeZone();
  }
  onTimeRangeChange(timeRange) {
    this.getAncestorTimeRange().onTimeRangeChange(timeRange);
  }
  onTimeZoneChange(timeZone) {
    this.getAncestorTimeRange().onTimeZoneChange(timeZone);
  }
  onRefresh() {
    this.getAncestorTimeRange().onRefresh();
  }
}

export { SceneTimeRangeTransformerBase };
//# sourceMappingURL=SceneTimeRangeTransformerBase.js.map
