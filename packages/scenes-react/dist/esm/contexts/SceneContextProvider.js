import React, { createContext, useContext, useState, useEffect } from 'react';
import { behaviors, SceneTimeRange, UrlSyncContextProvider } from '@grafana/scenes';
import { SceneContextObject } from './SceneContextObject.js';

const SceneContext = createContext(null);
function SceneContextProvider({ children, timeRange, withQueryController }) {
  const parentContext = useContext(SceneContext);
  const [childContext, setChildContext] = useState();
  const initialTimeRange = timeRange;
  useEffect(() => {
    const state = { children: [] };
    if (withQueryController) {
      state.$behaviors = [new behaviors.SceneQueryController()];
    }
    if (initialTimeRange) {
      state.$timeRange = new SceneTimeRange(initialTimeRange);
    }
    const childContext2 = new SceneContextObject(state);
    if (parentContext) {
      parentContext.addChildContext(childContext2);
    }
    const deactivate = childContext2.activate();
    setChildContext(childContext2);
    return () => {
      deactivate();
      if (parentContext) {
        parentContext.removeChildContext(childContext2);
      }
    };
  }, [parentContext, withQueryController]);
  if (!childContext) {
    return null;
  }
  const innerProvider = /* @__PURE__ */ React.createElement(SceneContext.Provider, {
    value: childContext
  }, children);
  if (parentContext) {
    return innerProvider;
  }
  return /* @__PURE__ */ React.createElement(UrlSyncContextProvider, {
    scene: childContext,
    updateUrlOnInit: true,
    createBrowserHistorySteps: true
  }, innerProvider);
}

export { SceneContext, SceneContextProvider };
//# sourceMappingURL=SceneContextProvider.js.map
