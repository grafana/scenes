import { sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks.js';

function useVariableValues(name) {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);
  if (!variable) {
    return [void 0, false];
  }
  variable.useState();
  const set = variable.parent;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();
  if (value == null) {
    return [void 0, isLoading];
  }
  if (!Array.isArray(value)) {
    value = [value];
  }
  return [value, isLoading];
}

export { useVariableValues };
//# sourceMappingURL=useVariableValues.js.map
