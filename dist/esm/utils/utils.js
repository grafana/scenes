import { useLocationService, locationService } from '@grafana/runtime';

function setBaseClassState(sceneObject, newState) {
  sceneObject.setState(newState);
}
function useLocationServiceSafe() {
  return useLocationService ? useLocationService() : locationService;
}

export { setBaseClassState, useLocationServiceSafe };
//# sourceMappingURL=utils.js.map
