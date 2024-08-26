import { SceneVariables, VariableValueSingle, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';

export function useVariableValues<T = VariableValueSingle>(name: string): [T[] | undefined, boolean] {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);

  if (!variable) {
    return [undefined, false];
  }

  variable.useState();

  const set = variable.parent as SceneVariables;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();

  if (value == null) {
    return [undefined, isLoading];
  }

  if (!Array.isArray(value)) {
    value = [value];
  }

  return [value as T[], isLoading];
}
