import React, { createContext, useContext, useEffect, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneTimeRangeLike } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { TimeRange } from '@grafana/data';
import { SceneVariable, SceneVariables, VariableValueSingle } from '../variables/types';
import { getUrlSyncManager } from '../services/UrlSyncManager';

export interface ReactSceneContextObjectState extends SceneObjectState {
  childContext?: SceneContextObject;
  children: SceneObject[];
}

export class SceneContextObject extends SceneObjectBase<ReactSceneContextObjectState> {}

export const SceneContext = createContext<SceneContextObject | null>(null);

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

export interface SceneContextProviderProps {
  children: React.ReactNode;
  initialState?: Partial<ReactSceneContextObjectState>;
}

/**
 * We could have TimeRangeContextProvider provider and VariableContextProvider as utility components, but the underlying context would be this context
 */
export function SceneContextProvider(props: SceneContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [childContext, setChildContext] = useState<SceneContextObject | undefined>();
  const [initialState, _] = useState(props.initialState);

  useEffect(() => {
    const childContext = new SceneContextObject({ ...initialState, children: [] });

    if (parentContext) {
      parentContext.setState({ childContext });
    } else {
      // We are the root context
      getUrlSyncManager().initSync(childContext);
    }

    const deactivate = childContext.activate();
    setChildContext(childContext);

    return () => {
      deactivate();

      if (parentContext) {
        parentContext.setState({ childContext: undefined });
      } else {
        // Cleanup url sync
        getUrlSyncManager().cleanUp(childContext);
      }
    };
  }, [parentContext, initialState]);

  if (!childContext) {
    return null;
  }

  return <SceneContext.Provider value={childContext}>{props.children}</SceneContext.Provider>;
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
