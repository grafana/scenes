import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SceneTimeRangeState, getUrlSyncManager, SceneTimeRange, behaviors } from '@grafana/scenes';

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
 * We could have TimeRangeContextProvider provider and VariableContextProvider as utility components, but the underlying context would be this context
 */
export function SceneContextProvider({ children, timeRange, withQueryController }: SceneContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [childContext, setChildContext] = useState<SceneContextObject | undefined>();
  const initialTimeRange = useRef(timeRange);

  useEffect(() => {
    const state: SceneContextObjectState = { children: [] };

    if (withQueryController) {
      state.$behaviors = [new behaviors.SceneQueryController()];
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
  }, [parentContext, withQueryController]);

  if (!childContext) {
    return null;
  }

  return <SceneContext.Provider value={childContext}>{children}</SceneContext.Provider>;
}
