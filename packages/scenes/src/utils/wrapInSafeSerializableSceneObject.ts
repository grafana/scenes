import { config } from '@grafana/runtime';
import { SceneObject } from '../core/types';
import { SafeSerializableSceneObject } from './SafeSerializableSceneObject';
import { ScopedVar } from '@grafana/data';

export function shouldWrapInSafeSerializableSceneObject(grafanaVersion: string): boolean {
  const pattern = /^(\d+)\.(\d+)\.(\d+)/;
  const match = grafanaVersion.match(pattern);

  if (!match) {
    return false;
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);

  if (major === 11) {
    return (minor === 0 && patch >= 4) || (minor === 1 && patch >= 2) || minor > 1;
  }

  if (major === 10) {
    return (minor === 4 && patch >= 8) || minor >= 5;
  }

  return major > 11; // Assuming versions greater than 11 are also supported.
}

export function wrapInSafeSerializableSceneObject(sceneObject: SceneObject): ScopedVar {
  const version = config.buildInfo.version;

  if (shouldWrapInSafeSerializableSceneObject(version)) {
    return new SafeSerializableSceneObject(sceneObject);
  }

  // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
  return { value: sceneObject, text: '__sceneObject' };
}
