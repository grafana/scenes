import { config } from '@grafana/runtime';
import { SafeSerializableSceneObject } from './SafeSerializableSceneObject.js';

function shouldWrapInSafeSerializableSceneObject(grafanaVersion) {
  const pattern = /^(\d+)\.(\d+)\.(\d+)/;
  const match = grafanaVersion.match(pattern);
  if (!match) {
    return false;
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  if (major === 11) {
    return minor === 0 && patch >= 4 || minor === 1 && patch >= 2 || minor > 1;
  }
  if (major === 10) {
    return minor === 4 && patch >= 8 || minor >= 5;
  }
  return major > 11;
}
function wrapInSafeSerializableSceneObject(sceneObject) {
  const version = config.buildInfo.version;
  if (shouldWrapInSafeSerializableSceneObject(version)) {
    return new SafeSerializableSceneObject(sceneObject);
  }
  return { value: sceneObject, text: "__sceneObject" };
}

export { shouldWrapInSafeSerializableSceneObject, wrapInSafeSerializableSceneObject };
//# sourceMappingURL=wrapInSafeSerializableSceneObject.js.map
