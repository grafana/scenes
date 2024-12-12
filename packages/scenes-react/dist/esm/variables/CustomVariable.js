import { useState, useEffect } from 'react';
import { CustomVariable as CustomVariable$1 } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks.js';

function CustomVariable({
  query,
  name,
  label,
  hide,
  initialValue,
  isMulti,
  includeAll,
  children
}) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState();
  let variable = scene.findVariable(name);
  if (!variable) {
    variable = new CustomVariable$1({ name, label, query, value: initialValue, isMulti, includeAll, hide });
  }
  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);
  useEffect(() => {
    variable == null ? void 0 : variable.setState({
      label,
      query,
      hide,
      isMulti,
      includeAll
    });
  }, [hide, includeAll, isMulti, label, query, variable]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

export { CustomVariable };
//# sourceMappingURL=CustomVariable.js.map
