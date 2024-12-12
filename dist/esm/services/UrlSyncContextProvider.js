import { useUrlSync } from './useUrlSync.js';

function UrlSyncContextProvider({
  children,
  scene,
  updateUrlOnInit,
  createBrowserHistorySteps
}) {
  const isInitialized = useUrlSync(scene, { updateUrlOnInit, createBrowserHistorySteps });
  if (!isInitialized) {
    return null;
  }
  return children;
}

export { UrlSyncContextProvider };
//# sourceMappingURL=UrlSyncContextProvider.js.map
