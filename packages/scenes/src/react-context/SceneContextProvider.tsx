import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneTimeRangeState } from '../core/types';
import { SceneVariable } from '../variables/types';
import { getUrlSyncManager } from '../services/UrlSyncManager';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneQueryController } from '../behaviors';

export interface ReactSceneContextObjectState extends SceneObjectState {
  childContext?: SceneContextObject;
  children: SceneObject[];
}

export class SceneContextObject extends SceneObjectBase<ReactSceneContextObjectState> {
  public constructor(state?: Partial<ReactSceneContextObjectState>) {
    super({
      ...state,
      children: state.children ?? [],
    });
  }

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

    getUrlSyncManager().syncNewObj(variable);

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

export interface SceneContextProviderProps {
  /**
   * Only the initial time range, cannot be used to update time range
   **/
  timeRange?: Partial<SceneTimeRangeState>;
  /**
   *  This makes it possbile to view running state of queries via
   *  refresh picker and also cancel all queries in the scene.
   */
  hasQueryController?: boolean;
  /** Children */
  children: React.ReactNode;
}

/**
 * We could have TimeRangeContextProvider provider and VariableContextProvider as utility components, but the underlying context would be this context
 */
export function SceneContextProvider({ children, timeRange, hasQueryController }: SceneContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [childContext, setChildContext] = useState<SceneContextObject | undefined>();
  const initialTimeRange = useRef(timeRange);

  useEffect(() => {
    const state: ReactSceneContextObjectState = { children: [] };

    if (hasQueryController) {
      state.$behaviors = [new SceneQueryController()];
    }

    if (initialTimeRange.current) {
      state.$timeRange = new SceneTimeRange(initialTimeRange.current);
    }

    const childContext = new SceneContextObject(state);

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
  }, [parentContext, hasQueryController]);

  if (!childContext) {
    return null;
  }

  return <SceneContext.Provider value={childContext}>{children}</SceneContext.Provider>;
}
