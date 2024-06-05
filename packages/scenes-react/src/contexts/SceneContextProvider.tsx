import React, { createContext, useContext, useEffect, useState } from 'react';
import { SceneTimeRangeState, SceneTimeRange, behaviors } from '@grafana/scenes';

import { SceneContextObject, SceneContextObjectState } from './SceneContextObject';

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
  withQueryController?: boolean;
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * Wrapps the react children in a SceneContext
 */
export function SceneContextProvider({ children, timeRange, withQueryController }: SceneContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [childContext, setChildContext] = useState<SceneContextObject | undefined>();

  // Becasue timeRange is not part of useEffect dependencies
  const initialTimeRange = timeRange;

  useEffect(() => {
    const state: SceneContextObjectState = { children: [] };

    if (withQueryController) {
      state.$behaviors = [new behaviors.SceneQueryController()];
    }

    if (initialTimeRange) {
      state.$timeRange = new SceneTimeRange(initialTimeRange);
    }

    const childContext = new SceneContextObject(state);

    if (parentContext) {
      parentContext.setState({ childContext });
    }

    const deactivate = childContext.activate();
    setChildContext(childContext);

    return () => {
      deactivate();

      if (parentContext) {
        parentContext.setState({ childContext: undefined });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentContext, withQueryController]);

  if (!childContext) {
    return null;
  }

  return <SceneContext.Provider value={childContext}>{children}</SceneContext.Provider>;
}

export interface SceneContextValueProviderProps {
  /**
   * Only the initial time range, cannot be used to update time range
   **/
  value: SceneContextObject;
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * Mostly useful from tests where you need to interact with the scene context object directly from outside the provider react tree.
 */
export function SceneContextValueProvider({ children, value }: SceneContextValueProviderProps) {
  const parentContext = useContext(SceneContext);
  const [isActivate, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (parentContext) {
      parentContext.setState({ childContext: value });
    }

    const deactivate = value.activate();
    setIsActive(true);

    return () => {
      deactivate();

      if (parentContext) {
        parentContext.setState({ childContext: undefined });
      }
    };
  }, [parentContext, value]);

  if (!isActivate) {
    return null;
  }

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}
