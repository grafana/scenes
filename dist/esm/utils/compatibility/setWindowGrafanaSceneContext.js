import { writeSceneLog } from '../writeSceneLog.js';

function setWindowGrafanaSceneContext(activeScene) {
  const prevScene = window.__grafanaSceneContext;
  writeSceneLog("setWindowGrafanaScene", "set window.__grafanaSceneContext", activeScene);
  window.__grafanaSceneContext = activeScene;
  return () => {
    if (window.__grafanaSceneContext === activeScene) {
      writeSceneLog("setWindowGrafanaScene", "restore window.__grafanaSceneContext", prevScene);
      window.__grafanaSceneContext = prevScene;
    }
  };
}

export { setWindowGrafanaSceneContext };
//# sourceMappingURL=setWindowGrafanaSceneContext.js.map
