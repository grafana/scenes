import { ScopedVar } from '@grafana/data';
import { SceneObject } from '../core/types';

export class SafeSerializableSceneObject implements ScopedVar {
  #value: SceneObject;

  public constructor(value: SceneObject) {
    this.#value = value;
  }

  public toString() {
    return undefined;
  }

  public valueOf() {
    return this.#value;
  }

  public get value() {
    return this;
  }

  public get text() {
    return '__sceneObject';
  }
}
