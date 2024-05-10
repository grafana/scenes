import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneDataState, SceneObject, SceneObjectState } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { PanelData, TimeRange } from '@grafana/data';
import { TimeRangePicker } from '@grafana/ui';
import { SceneVariable, SceneVariables, VariableValue, VariableValueSingle } from '../variables/types';
import { VariableValueSelectWrapper } from '../variables/components/VariableValueSelectors';
import { RVizPanel } from './RVizPanel';
import { useSceneQuery } from './useSceneQuery';

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

export function useTimeRange(): [TimeRange, (timeRange: TimeRange) => void] {
  const { scene } = useContext(SceneContext);
  const sceneTimeRange = sceneGraph.getTimeRange(scene);
  const { value } = sceneTimeRange.useState();

  return [value, sceneTimeRange.onTimeRangeChange];
}

export function useVariables(): SceneVariable[] {
  const { scene } = useContext(SceneContext);
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
  const [isActive, setActive] = useState(false);

  const childScene = useMemo(() => {
    const child = new ReactSceneContextObject({ ...props.initialState, children: [] });
    parentContext.scene.setState({ childContext: child });
    return child;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentContext.scene]);

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
  const { scene } = useContext(SceneContext);
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
