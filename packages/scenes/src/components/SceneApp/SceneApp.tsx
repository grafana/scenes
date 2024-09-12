import React, { createContext } from 'react';
import { Route, Switch } from 'react-router-dom';

import { DataRequestEnricher, SceneComponentProps } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneAppState } from './types';
import { renderSceneComponentWithRouteProps } from './utils';

/**
 * Responsible for top level pages routing
 */
export class SceneApp extends SceneObjectBase<SceneAppState> implements DataRequestEnricher {
  public enrichDataRequest() {
    return {
      app: this.state.name || 'app',
    };
  }

  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <SceneAppContext.Provider value={model}>
        <Switch>
          {pages.map((page) => (
            <Route
              key={page.state.url}
              exact={false}
              path={page.state.url}
              render={(props) => renderSceneComponentWithRouteProps(page, props)}
            ></Route>
          ))}
        </Switch>
      </SceneAppContext.Provider>
    );
  };
}

export const SceneAppContext = createContext<SceneApp | null>(null);

const sceneAppCache = new Map<object, SceneApp>();

/**
 * Caches the the resulting SceneApp returned by the factory function so that it's only called once during the lifetime of the browser tab
 */
export function useSceneApp(factory: () => SceneApp) {
  const cachedApp = sceneAppCache.get(factory);

  if (cachedApp) {
    return cachedApp;
  }

  const newApp = factory();
  sceneAppCache.set(factory, newApp);

  return newApp;
}
