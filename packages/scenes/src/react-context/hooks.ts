import { useCallback, useContext, useEffect, useState } from 'react';
import { SceneContext } from './SceneContextProvider';
import { TimeRange } from '@grafana/data';
import { SceneTimeRangeLike } from '../core/types';
import {
  SceneVariable,
  SceneVariableValueChangedEvent,
  SceneVariables,
  VariableValue,
  VariableValueSingle,
  sceneGraph,
} from '..';
import { Subscription } from 'rxjs';

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

/**
 * Only returns the variables on the closest context level.
 * We could modify it to extract all variables from the full context tree.
 */
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

export interface UseUpdateWhenSceneChangesOptions {
  /** Variable names */
  variables?: string[];
  timeRange?: boolean;
}

export interface UseUpdateWhenSceneChangesReason {
  variableName?: string;
  variableValue?: VariableValue;
  timeRange?: TimeRange;
}

/**
 * A utility hook to re-render the calling react component when specified variables or time range changes
 */
export function useUpdateWhenSceneChanges({ timeRange, variables }: UseUpdateWhenSceneChangesOptions) {
  const scene = useSceneContext();
  const [updateReason, setUpdateReason] = useState<UseUpdateWhenSceneChangesReason>();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, setUpdateReason, timeRange, ...variables]);

  return updateReason;
}

/**
 * Mainly a utility hook to re-render the calling react component when specified variables or time range changes
 */
export function useVariableInterpolator(options: UseUpdateWhenSceneChangesOptions) {
  const scene = useSceneContext();

  useUpdateWhenSceneChanges(options);

  return useCallback(
    (str: string) => {
      return sceneGraph.interpolate(scene, str);
    },
    [scene]
  );
}
