import { SceneObjectUrlSyncHandler, SceneObjectWithUrlSync, SceneObjectUrlValues } from '../core/types';

interface SceneObjectUrlSyncConfigOptions {
  keys: string[] | (() => string[]);
}

export class SceneObjectUrlSyncConfig implements SceneObjectUrlSyncHandler {
  private _keys: string[] | (() => string[]);

  public constructor(private _sceneObject: SceneObjectWithUrlSync, _options: SceneObjectUrlSyncConfigOptions) {
    this._keys = _options.keys;
  }

  public getKeys(): string[] {
    if (typeof this._keys === 'function') {
      return this._keys();
    }

    return this._keys;
  }

  public getUrlState(): SceneObjectUrlValues {
    return this._sceneObject.getUrlState();
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    this._sceneObject.updateFromUrl(values);
  }
}
