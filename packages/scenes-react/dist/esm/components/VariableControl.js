import React from 'react';
import { sceneGraph, VariableValueSelectWrapper } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks.js';

function VariableControl({ name, hideLabel, layout }) {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);
  if (!variable) {
    return /* @__PURE__ */ React.createElement("div", null, "Variable ", name, " not found");
  }
  return /* @__PURE__ */ React.createElement(VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    hideLabel,
    layout
  });
}

export { VariableControl };
//# sourceMappingURL=VariableControl.js.map
