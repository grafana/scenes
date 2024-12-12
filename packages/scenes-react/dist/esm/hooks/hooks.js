import { useContext, useState, useEffect, useCallback } from 'react';
import { SceneContext } from '../contexts/SceneContextProvider.js';
import { sceneGraph, SceneVariableValueChangedEvent } from '@grafana/scenes';
import { Subscription } from 'rxjs';

function useSceneContext() {
  const scene = useContext(SceneContext);
  if (!scene) {
    throw new Error("Cannot find a SceneContext");
  }
  return scene;
}
function useTimeRange() {
  const scene = useSceneContext();
  const sceneTimeRange = sceneGraph.getTimeRange(scene);
  const { value } = sceneTimeRange.useState();
  return [value, sceneTimeRange];
}
function useVariables() {
  const scene = useSceneContext();
  const variables = sceneGraph.getVariables(scene);
  return variables.useState().variables;
}
function useUpdateWhenSceneChanges({ timeRange, variables = [] }) {
  const scene = useSceneContext();
  const [updateReason, setUpdateReason] = useState();
  useEffect(() => {
    const subscriptions = new Subscription();
    if (variables && variables.length > 0) {
      for (const v of variables) {
        const variable = sceneGraph.lookupVariable(v, scene);
        if (variable) {
          subscriptions.add(
            variable.subscribeToEvent(SceneVariableValueChangedEvent, () => {
              setUpdateReason({ variableName: variable.state.name, variableValue: variable.getValue() });
            })
          );
        }
      }
    }
    if (timeRange) {
      const tr = sceneGraph.getTimeRange(scene);
      tr.subscribeToState((newState, oldState) => {
        if (newState.value !== oldState.value) {
          setUpdateReason({ timeRange: newState.value });
        }
      });
    }
    return () => subscriptions.unsubscribe();
  }, [scene, timeRange, ...variables]);
  return updateReason;
}
function useVariableInterpolator(options) {
  const scene = useSceneContext();
  useUpdateWhenSceneChanges(options);
  return useCallback(
    (str) => {
      return sceneGraph.interpolate(scene, str);
    },
    [scene]
  );
}

export { useSceneContext, useTimeRange, useUpdateWhenSceneChanges, useVariableInterpolator, useVariables };
//# sourceMappingURL=hooks.js.map
