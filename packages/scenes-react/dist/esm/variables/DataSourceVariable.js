import { useState, useEffect } from 'react';
import { DataSourceVariable as DataSourceVariable$1 } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks.js';

function DataSourceVariable({
  pluginId,
  regex,
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
    variable = new DataSourceVariable$1({
      pluginId,
      regex,
      name,
      label,
      value: initialValue,
      isMulti,
      hide,
      includeAll
    });
  }
  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);
  useEffect(() => {
    if (!variableAdded) {
      return;
    }
    if (variable.state.pluginId === pluginId && variable.state.regex === regex && variable.state.label === label && variable.state.hide === hide && variable.state.includeAll === includeAll) {
      return;
    }
    variable.setState({
      pluginId,
      regex,
      label,
      hide,
      includeAll
    });
    variable.refreshOptions();
  }, [hide, includeAll, label, pluginId, regex, variable, variableAdded]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

export { DataSourceVariable };
//# sourceMappingURL=DataSourceVariable.js.map
