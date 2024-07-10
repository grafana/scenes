import { SceneObject } from '../core/types';

export class SafeSerializableSceneObject {
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
}
