import { SceneObjectUrlSyncHandler, SceneObjectWithUrlSync, SceneObjectUrlValues } from '../core/types';

interface SceneObjectUrlSyncConfigOptions {
  keys: string[];
}

export class SceneObjectUrlSyncConfig implements SceneObjectUrlSyncHandler {
  private _keys: string[];

  public constructor(private _sceneObject: SceneObjectWithUrlSync, _options: SceneObjectUrlSyncConfigOptions) {
    this._keys = _options.keys;
  }

  public getKeys(): string[] {
    return this._keys;
  }

  public getUrlState(): SceneObjectUrlValues {
    return this._sceneObject.getUrlState();
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    this._sceneObject.updateFromUrl(values);
  }
}
