import { sceneGraph, MultiValueVariable } from '@grafana/scenes';
import { useSceneContext } from './hooks.js';

function useVariableValue(name) {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);
  if (!variable || variable instanceof MultiValueVariable && variable.state.isMulti === true) {
    return [void 0, false];
  }
  variable.useState();
  const set = variable.parent;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();
  if (value == null) {
    return [void 0, isLoading];
  }
  return [value, isLoading];
}

export { useVariableValue };
//# sourceMappingURL=useVariableValue.js.map
