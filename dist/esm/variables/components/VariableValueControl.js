import React from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { VariableValueSelectWrapper } from './VariableValueSelectors.js';

class VariableValueControl extends SceneObjectBase {
}
VariableValueControl.Component = VariableValueControlRenderer;
function VariableValueControlRenderer({ model }) {
  const variable = sceneGraph.lookupVariable(model.state.variableName, model);
  if (!variable) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    layout: model.state.layout,
    showAlways: true
  });
}

export { VariableValueControl };
//# sourceMappingURL=VariableValueControl.js.map
