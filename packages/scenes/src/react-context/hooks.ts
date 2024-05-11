import { useContext } from 'react';
import { SceneContext } from './SceneContextProvider';
import { TimeRange } from '@grafana/data';
import { SceneTimeRangeLike } from '../core/types';
import { SceneVariable, SceneVariables, VariableValueSingle, sceneGraph } from '..';

export function useSceneContext() {
  const scene = useContext(SceneContext);
  if (!scene) {
    throw new Error('Cannot find a SceneContext');
  }

  return scene;
}

export function useTimeRange(): [TimeRange, SceneTimeRangeLike] {
  const scene = useSceneContext();
  const sceneTimeRange = sceneGraph.getTimeRange(scene);
  const { value } = sceneTimeRange.useState();

  return [value, sceneTimeRange];
}

export function useVariables(): SceneVariable[] {
  const scene = useSceneContext();
  const variables = sceneGraph.getVariables(scene);
  return variables.useState().variables;
}

export function useVariableValues(name: string): [VariableValueSingle[] | undefined, boolean] {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);

  if (!variable) {
    return [undefined, false];
  }

  variable.useState();

  const set = variable.parent as SceneVariables;
  const isLoading = set.isVariableLoadingOrWaitingToUpdate(variable);
  let value = variable.getValue();

  if (!Array.isArray(value)) {
    value = [value];
  }

  return [value, isLoading];
}
