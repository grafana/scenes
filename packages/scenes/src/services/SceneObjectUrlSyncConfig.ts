import { SceneObjectUrlSyncHandler, SceneObjectWithUrlSync, SceneObjectUrlValues } from '../core/types';
import { getUrlSyncManager } from '../core/sceneGraph/sceneGraph';
import { getNamespacedKey } from './utils';

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

    let keys: string[];
    if (typeof this._keys === 'function') {
      keys = this._keys();
    }else{
      keys = this._keys;
    }

    // This doesn't work because the getKeys method is called (by getUrlState) before activation of the scene object,
    // at this point we have no relation to the parent scene node, so the urlSyncManager associated with a scene graph cannot be queried
    // I "understand" this to mean that namespaces must be defined at instantiation time, and cannot be pulled from react context (as the component has yet to be rendered), or from scenes (as the scene object is not yet attached to the scene graph).
    const urlSyncManager = getUrlSyncManager(this._sceneObject)
    const namespace = urlSyncManager?.getNamespace()

    const mappedKeys = keys.map(key => getNamespacedKey(key, namespace));
    console.log('SceneObjectUrlSyncConfig getKeys', {urlSyncManager, mappedKeys, namespace, object: this._sceneObject })

    return mappedKeys;
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
