import React, { createContext } from 'react';
import { Switch, Route } from 'react-router-dom';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { renderSceneComponentWithRouteProps } from './utils.js';

class SceneApp extends SceneObjectBase {
  enrichDataRequest() {
    return {
      app: this.state.name || "app"
    };
  }
}
SceneApp.Component = ({ model }) => {
  const { pages } = model.useState();
  return /* @__PURE__ */ React.createElement(SceneAppContext.Provider, {
    value: model
  }, /* @__PURE__ */ React.createElement(Switch, null, pages.map((page) => /* @__PURE__ */ React.createElement(Route, {
    key: page.state.url,
    exact: false,
    path: page.state.url,
    render: (props) => renderSceneComponentWithRouteProps(page, props)
  }))));
};
const SceneAppContext = createContext(null);
const sceneAppCache = /* @__PURE__ */ new Map();
function useSceneApp(factory) {
  const cachedApp = sceneAppCache.get(factory);
  if (cachedApp) {
    return cachedApp;
  }
  const newApp = factory();
  sceneAppCache.set(factory, newApp);
  return newApp;
}

export { SceneApp, SceneAppContext, useSceneApp };
//# sourceMappingURL=SceneApp.js.map
