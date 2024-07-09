import { MultiValueVariable, SceneVariables, VariableValueSingle, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';

export function useVariableValue(name: string): [VariableValueSingle | undefined, boolean] {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);

  if (!variable || (variable instanceof MultiValueVariable && variable.state.isMulti === true)) {
    return [undefined, false];
  }

  variable.useState();

  const set = variable.parent as SceneVariables;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();

  if (value == null) {
    return [undefined, isLoading];
  }

  return [value as VariableValueSingle, isLoading];
}
