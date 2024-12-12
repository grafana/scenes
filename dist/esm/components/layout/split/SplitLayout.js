import { SceneObjectBase } from '../../../core/SceneObjectBase.js';
import { SplitLayoutRenderer } from './SplitLayoutRenderer.js';

class SplitLayout extends SceneObjectBase {
  toggleDirection() {
    this.setState({
      direction: this.state.direction === "row" ? "column" : "row"
    });
  }
  isDraggable() {
    return false;
  }
}
SplitLayout.Component = SplitLayoutRenderer;

export { SplitLayout };
//# sourceMappingURL=SplitLayout.js.map
