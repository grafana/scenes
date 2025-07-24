import { createContext } from 'react';
import { Route, Routes } from 'react-router-dom';

import { DataRequestEnricher, SceneComponentProps } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneAppState } from './types';

/**
 * Responsible for top level pages routing
 */
export class SceneApp extends SceneObjectBase<SceneAppState> implements DataRequestEnricher {
  protected _renderBeforeActivation = true;

  public enrichDataRequest() {
    return {
      app: this.state.name || 'app',
    };
  }

  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <>
        <SceneAppContext.Provider value={model}>
          <Routes>
            {pages.map((page) => (
              <Route key={page.state.url} path={page.state.routePath} element={<page.Component model={page} />} />
            ))}
          </Routes>
        </SceneAppContext.Provider>
      </>
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
