import React, { createContext, useContext, useEffect, useState } from 'react';
import { SceneTimeRangeState, SceneTimeRange, behaviors, UrlSyncContextProvider } from '@grafana/scenes';

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
      parentContext.addChildContext(childContext);
    }

    const deactivate = childContext.activate();
    setChildContext(childContext);

    return () => {
      deactivate();

      if (parentContext) {
        parentContext.removeChildContext(childContext);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentContext, withQueryController]);

  if (!childContext) {
    return null;
  }

  const innerProvider = <SceneContext.Provider value={childContext}>{children}</SceneContext.Provider>;

  if (parentContext) {
    return innerProvider;
  }

  // For root context we wrap the provider in a UrlSyncWrapper that handles the hook that updates state on location changes
  return (
    <UrlSyncContextProvider scene={childContext} updateUrlOnInit={true} createBrowserHistorySteps={true}>
      {innerProvider}
    </UrlSyncContextProvider>
  );
}
