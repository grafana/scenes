import { SceneObjectUrlSyncHandler, SceneObjectWithUrlSync, SceneObjectUrlValues } from '../core/types';

interface SceneObjectUrlSyncConfigOptions {
  keys: string[] | (() => string[]);
}

export class SceneObjectUrlSyncConfig implements SceneObjectUrlSyncHandler {
  private _keys: string[] | (() => string[]);
  private _nextChangeShouldAddHistoryStep = false;

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

  public shouldCreateHistoryStep(values: SceneObjectUrlValues): boolean {
    return this._nextChangeShouldAddHistoryStep;
  }

  public performBrowserHistoryAction(callback: () => void) {
    this._nextChangeShouldAddHistoryStep = true;
    callback();
    this._nextChangeShouldAddHistoryStep = false;
  }
}
