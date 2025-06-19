import { SceneObjectUrlSyncHandler, SceneObjectWithUrlSync, SceneObjectUrlValues } from '../core/types';

interface SceneObjectUrlSyncConfigOptions {
  keys: string[] | (() => string[]);
  namespace?: string;
  excludeFromNamespace?: string[];
}

export class SceneObjectUrlSyncConfig implements SceneObjectUrlSyncHandler {
  private _keys: string[] | (() => string[]);
  private _namespace: string;
  private _excludeFromNamespace: string[];
  private _nextChangeShouldAddHistoryStep = false;

  public constructor(private _sceneObject: SceneObjectWithUrlSync, _options: SceneObjectUrlSyncConfigOptions) {
    this._keys = _options.keys;
    this._namespace = _options.namespace ?? '';
    this._excludeFromNamespace = _options.excludeFromNamespace ?? [];

    if (typeof this._keys !== 'function') {
      this._keys = this._keys.map((key) => this._getNamespacedKey(key));
    }
  }

  private _getNamespacedKey(keyWithoutNamespace: string) {
    if (this._namespace && !this._excludeFromNamespace.includes(keyWithoutNamespace)) {
      return `${this._namespace}-${keyWithoutNamespace}`;
    }
    return keyWithoutNamespace;
  }

  public getKeys(): string[] {
    if (typeof this._keys === 'function') {
      return this._keys().map((key) => this._getNamespacedKey(key));
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
