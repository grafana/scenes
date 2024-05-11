import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneTimeRangeLike } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { TimeRange } from '@grafana/data';
import { SceneVariable, SceneVariables, VariableValueSingle } from '../variables/types';
import { Stack } from '@grafana/ui';

export interface SceneContextValue {
  scene: ReactSceneContextObject;
}

export interface ReactSceneContextObjectState extends SceneObjectState {
  childContext?: ReactSceneContextObject;
  children: SceneObject[];
}

export class ReactSceneContextObject extends SceneObjectBase<ReactSceneContextObjectState> {}

export const SceneContext = createContext<SceneContextValue>({
  scene: new ReactSceneContextObject({ children: [] }),
});

export function useSceneContext() {
  return useContext(SceneContext).scene;
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
  const parentContext = useSceneContext();
  const [isActive, setActive] = useState(false);

  const childScene = useMemo(() => {
    const child = new ReactSceneContextObject({ ...props.initialState, children: [] });
    parentContext.setState({ childContext: child });
    return child;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentContext]);

  useEffect(() => {
    const fn = childScene.activate();
    setActive(true);
    return fn;
  }, [childScene]);

  // This is to make sure the context scene is active before children is rendered. Important for child SceneQueryRunners
  if (!isActive) {
    return null;
  }

  return <SceneContext.Provider value={{ scene: childScene }}>{props.children}</SceneContext.Provider>;
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
