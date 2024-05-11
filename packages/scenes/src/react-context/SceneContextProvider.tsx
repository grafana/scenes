import React, { createContext, useContext, useEffect, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneTimeRangeLike } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { TimeRange } from '@grafana/data';
import { SceneVariable, SceneVariables, VariableValueSingle } from '../variables/types';
import { getUrlSyncManager } from '../services/UrlSyncManager';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { writeSceneLog } from '../utils/writeSceneLog';

export interface ReactSceneContextObjectState extends SceneObjectState {
  childContext?: SceneContextObject;
  children: SceneObject[];
}

export class SceneContextObject extends SceneObjectBase<ReactSceneContextObjectState> {
  public addToScene(obj: SceneObject) {
    this.setState({ children: [...this.state.children, obj] });

    writeSceneLog('SceneContext', `Adding to scene: ${obj.constructor.name} key: ${obj.state.key}`);
  }

  public removeFromScene(obj: SceneObject) {
    this.setState({ children: this.state.children.filter((x) => x !== obj) });
    writeSceneLog('SceneContext', `Removing from scene: ${obj.constructor.name} key: ${obj.state.key}`);
  }

  public findByKey<T>(key: string): T | undefined {
    return this.state.children.find((x) => x.state.key === key) as T;
  }

  public findVariable<T>(name: string): T | undefined {
    const variables = this.state.$variables as SceneVariableSet;
    if (!variables) {
      return;
    }

    return variables.getByName(name) as T;
  }

  public addVariable(variable: SceneVariable) {
    let set = this.state.$variables as SceneVariableSet;

    if (set) {
      set.setState({ variables: [...set.state.variables, variable] });
    } else {
      this.setState({ $variables: new SceneVariableSet({ variables: [variable] }) });
    }

    writeSceneLog('SceneContext', `Adding variable: ${variable.constructor.name} key: ${variable.state.key}`);
  }

  public removeVariable(variable: SceneVariable) {
    let set = this.state.$variables as SceneVariableSet;
    if (set) {
      set.setState({ variables: set.state.variables.filter((x) => x !== variable) });
      writeSceneLog('SceneContext', `Removing variable: ${variable.constructor.name} key: ${variable.state.key}`);
    }
  }
}

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
