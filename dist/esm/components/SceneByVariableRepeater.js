import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig.js';
import { MultiValueVariable } from '../variables/variants/MultiValueVariable.js';

class SceneByVariableRepeater extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._variableDependency = new VariableDependencyConfig(
      this,
      {
        variableNames: [this.state.variableName],
        onVariableUpdateCompleted: () => this.performRepeat()
      }
    );
    this.addActivationHandler(() => this.performRepeat());
  }
  performRepeat() {
    if (this._variableDependency.hasDependencyInLoadingState()) {
      return;
    }
    const variable = sceneGraph.lookupVariable(this.state.variableName, this);
    if (!(variable instanceof MultiValueVariable)) {
      console.error("SceneByVariableRepeater: variable is not a MultiValueVariable");
      return;
    }
    const values = getMultiVariableValues(variable);
    const newChildren = [];
    for (const option of values) {
      const layoutChild = this.state.getLayoutChild(option);
      newChildren.push(layoutChild);
    }
    this.state.body.setState({ children: newChildren });
  }
}
SceneByVariableRepeater.Component = ({ model }) => {
  const { body } = model.useState();
  return /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  });
};
function getMultiVariableValues(variable) {
  const { value, text, options } = variable.state;
  if (variable.hasAllValue()) {
    return options;
  }
  if (Array.isArray(value) && Array.isArray(text)) {
    return value.map((v, i) => ({ value: v, label: text[i] }));
  }
  return [{ value, label: text }];
}

export { SceneByVariableRepeater, getMultiVariableValues };
//# sourceMappingURL=SceneByVariableRepeater.js.map
