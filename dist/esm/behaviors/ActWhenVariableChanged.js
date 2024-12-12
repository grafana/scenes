import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig.js';

class ActWhenVariableChanged extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._runningEffect = null;
    this._variableDependency = new VariableDependencyConfig(this, {
      variableNames: [this.state.variableName],
      onReferencedVariableValueChanged: this._onVariableChanged.bind(this)
    });
  }
  _onVariableChanged(variable) {
    const effect = this.state.onChange;
    if (this._runningEffect) {
      this._runningEffect();
      this._runningEffect = null;
    }
    const cancellation = effect(variable, this);
    if (cancellation) {
      this._runningEffect = cancellation;
    }
  }
}

export { ActWhenVariableChanged };
//# sourceMappingURL=ActWhenVariableChanged.js.map
