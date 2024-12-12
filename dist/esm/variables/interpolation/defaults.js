import { SceneDataNode } from '../../core/SceneDataNode.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { SceneTimeRange } from '../../core/SceneTimeRange.js';

const EmptyDataNode = new SceneDataNode();
const DefaultTimeRange = new SceneTimeRange();
class EmptyVariableSetImpl extends SceneObjectBase {
  constructor() {
    super({ variables: [] });
  }
  getByName(name) {
    return void 0;
  }
  isVariableLoadingOrWaitingToUpdate(variable) {
    return false;
  }
}
const EmptyVariableSet = new EmptyVariableSetImpl();

export { DefaultTimeRange, EmptyDataNode, EmptyVariableSet, EmptyVariableSetImpl };
//# sourceMappingURL=defaults.js.map
