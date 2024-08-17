import { ScopedVar } from '@grafana/data';
import { SceneObject } from '../core/types';

export class SafeSerializableSceneObject implements ScopedVar {
  private _value: SceneObject;

  public text = '__sceneObject';

  public constructor(value: SceneObject) {
    this._value = value;
  }

  public toString() {
    return undefined;
  }

  public valueOf = () => {
    return this._value;
  };

  public get value() {
    return this;
  }
}
