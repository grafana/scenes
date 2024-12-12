import { useState, useEffect } from 'react';
import { QueryVariable as QueryVariable$1 } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks.js';
import { isEqual } from 'lodash';

function QueryVariable({
  query,
  name,
  datasource,
  label,
  hide,
  regex,
  refresh,
  sort,
  initialValue,
  isMulti,
  includeAll,
  children
}) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState();
  let variable = scene.findVariable(name);
  if (!variable) {
    variable = new QueryVariable$1({
      name,
      label,
      query,
      datasource,
      refresh,
      sort,
      regex,
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
    if (isEqual(variable.state.query, query) && isEqual(variable.state.datasource, datasource) && variable.state.regex === regex && variable.state.label === label && variable.state.hide === hide && variable.state.includeAll === includeAll && variable.state.refresh === refresh && variable.state.sort === sort) {
      return;
    }
    variable.setState({
      label,
      query,
      datasource,
      refresh,
      sort,
      regex,
      hide,
      includeAll
    });
    variable.refreshOptions();
  }, [datasource, hide, includeAll, label, query, refresh, regex, sort, variable, variableAdded]);
  if (!variableAdded) {
    return null;
  }
  return children;
}

export { QueryVariable };
//# sourceMappingURL=QueryVariable.js.map
