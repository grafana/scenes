import { Location, UnregisterCallback } from 'history';
import { isEqual } from 'lodash';

import { locationService } from '@grafana/runtime';

import { SceneObjectStateChangedEvent } from '../core/events';
import { SceneObject, SceneObjectUrlValue, SceneObjectUrlValues } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { Unsubscribable } from 'rxjs';

export interface UrlSyncManagerLike {
  initSync(root: SceneObject): void;
  cleanUp(root: SceneObject): void;
  getUrlState(root: SceneObject): SceneObjectUrlValues;
}

export class UrlSyncManager implements UrlSyncManagerLike {
  private urlKeyMapper = new UniqueUrlKeyMapper();
  private _sceneRoot!: SceneObject;
  private _stateSub: Unsubscribable | null = null;
  private _locationSub?: UnregisterCallback | null = null;
  private _lastPath?: string;

  /**
   * Updates the current scene state to match URL state.
   */
  public initSync(root: SceneObject) {
    if (!this._locationSub) {
      writeSceneLog('UrlSyncManager', 'New location listen');
      this._locationSub = locationService.getHistory().listen(this._onLocationUpdate);
    }

    if (this._stateSub) {
      writeSceneLog('UrlSyncManager', 'Unregister previous scene state subscription', this._sceneRoot.state.key);
      this._stateSub.unsubscribe();
    }

    this._sceneRoot = root;
    this._lastPath = locationService.getLocation().pathname;
    this._stateSub = root.subscribeToEvent(SceneObjectStateChangedEvent, this._onStateChanged);

    this.syncFrom(this._sceneRoot);
  }

  public cleanUp(root: SceneObject) {
    // Ignore this if we have a new or different root
    if (this._sceneRoot !== root) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'Clean up');

    if (this._locationSub) {
      this._locationSub();
      writeSceneLog('UrlSyncManager', 'Unregister history listen');
      this._locationSub = null;
    }

    if (this._stateSub) {
      this._stateSub.unsubscribe();
      this._stateSub = null;
      writeSceneLog(
        'UrlSyncManager',
        'Root deactived, unsub to state',
        'same key',
        this._sceneRoot.state.key === root.state.key
      );
    }
  }

  public syncFrom(sceneObj: SceneObject) {
    const urlParams = locationService.getSearch();
    // The index is always from the root
    this.urlKeyMapper.rebuildIndex(this._sceneRoot);
    this._syncSceneStateFromUrl(sceneObj, urlParams);
  }

  private _onLocationUpdate = (location: Location) => {
    if (this._lastPath !== location.pathname) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    // Rebuild key mapper index before starting sync
    this.urlKeyMapper.rebuildIndex(this._sceneRoot);
    // Sync scene state tree from url
    this._syncSceneStateFromUrl(this._sceneRoot, urlParams);
    this._lastPath = location.pathname;
  };

  private _onStateChanged = ({ payload }: SceneObjectStateChangedEvent) => {
    const changedObject = payload.changedObject;

    if (changedObject.urlSync) {
      const newUrlState = changedObject.urlSync.getUrlState();

      const searchParams = locationService.getSearch();
      const mappedUpdated: SceneObjectUrlValues = {};

      this.urlKeyMapper.rebuildIndex(this._sceneRoot);

      for (const [key, newUrlValue] of Object.entries(newUrlState)) {
        const uniqueKey = this.urlKeyMapper.getUniqueKey(key, changedObject);
        const currentUrlValue = searchParams.getAll(uniqueKey);

        if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
          mappedUpdated[uniqueKey] = newUrlValue;
        }
      }

      if (Object.keys(mappedUpdated).length > 0) {
        locationService.partial(mappedUpdated, true);
      }
    }
  };

  private _syncSceneStateFromUrl(sceneObject: SceneObject, urlParams: URLSearchParams) {
    if (sceneObject.urlSync) {
      const urlState: SceneObjectUrlValues = {};
      const currentState = sceneObject.urlSync.getUrlState();

      for (const key of sceneObject.urlSync.getKeys()) {
        const uniqueKey = this.urlKeyMapper.getUniqueKey(key, sceneObject);
        const newValue = urlParams.getAll(uniqueKey);
        const currentValue = currentState[key];

        if (isUrlValueEqual(newValue, currentValue)) {
          continue;
        }

        if (newValue.length > 0) {
          if (Array.isArray(currentValue)) {
            urlState[key] = newValue;
          } else {
            urlState[key] = newValue[0];
          }
        } else {
          // mark this key as having no url state
          urlState[key] = null;
        }
      }

      if (Object.keys(urlState).length > 0) {
        sceneObject.urlSync.updateFromUrl(urlState);
      }
    }

    sceneObject.forEachChild((child) => this._syncSceneStateFromUrl(child, urlParams));
  }

  public getUrlState(root: SceneObject): SceneObjectUrlValues {
    const urlKeyMapper = new UniqueUrlKeyMapper();
    urlKeyMapper.rebuildIndex(root);

    const result: SceneObjectUrlValues = {};

    const visitNode = (obj: SceneObject) => {
      if (obj.urlSync) {
        const newUrlState = obj.urlSync.getUrlState();

        for (const [key, value] of Object.entries(newUrlState)) {
          if (value != null) {
            const uniqueKey = urlKeyMapper.getUniqueKey(key, obj);
            result[uniqueKey] = value;
          }
        }
      }

      obj.forEachChild(visitNode);
    };

    visitNode(root);
    return result;
  }
}

interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}
class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObjectWithDepth[]>();

  public getUniqueKey(key: string, obj: SceneObject) {
    const objectsWithKey = this.index.get(key);
    if (!objectsWithKey) {
      throw new Error("Cannot find any scene object that uses the key '" + key + "'");
    }

    const address = objectsWithKey.findIndex((o) => o.sceneObject === obj);
    if (address > 0) {
      return `${key}-${address + 1}`;
    }

    return key;
  }

  public rebuildIndex(root: SceneObject) {
    this.index.clear();
    this.buildIndex(root, 0);
  }

  private buildIndex(sceneObject: SceneObject, depth: number) {
    if (sceneObject.urlSync) {
      for (const key of sceneObject.urlSync.getKeys()) {
        const hit = this.index.get(key);
        if (hit) {
          hit.push({ sceneObject, depth });
          hit.sort((a, b) => a.depth - b.depth);
        } else {
          this.index.set(key, [{ sceneObject, depth }]);
        }
      }
    }

    sceneObject.forEachChild((child) => this.buildIndex(child, depth + 1));
  }
}

export function isUrlValueEqual(currentUrlValue: string[], newUrlValue: SceneObjectUrlValue): boolean {
  if (currentUrlValue.length === 0 && newUrlValue == null) {
    return true;
  }

  if (!Array.isArray(newUrlValue) && currentUrlValue?.length === 1) {
    return newUrlValue === currentUrlValue[0];
  }

  if (newUrlValue?.length === 0 && currentUrlValue === null) {
    return true;
  }

  // We have two arrays, lets compare them
  return isEqual(currentUrlValue, newUrlValue);
}

let urlSyncManager: UrlSyncManagerLike | undefined;

export function getUrlSyncManager(): UrlSyncManagerLike {
  if (!urlSyncManager) {
    urlSyncManager = new UrlSyncManager();
  }

  return urlSyncManager;
}
