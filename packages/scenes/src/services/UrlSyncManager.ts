import { Location, UnregisterCallback } from 'history';

import { locationService } from '@grafana/runtime';

import { SceneObjectStateChangedEvent } from '../core/events';
import { SceneObject, SceneObjectUrlValues } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { Unsubscribable } from 'rxjs';
import { UniqueUrlKeyMapper } from './UniqueUrlKeyMapper';
import { getUrlState, isUrlValueEqual, syncStateFromUrl } from './utils';

export interface UrlSyncManagerLike {
  initSync(root: SceneObject): void;
  cleanUp(root: SceneObject): void;
  getUrlState(root: SceneObject): SceneObjectUrlValues;
  syncNewObj(obj: SceneObject): void;
}

export class UrlSyncManager implements UrlSyncManagerLike {
  private _urlKeyMapper = new UniqueUrlKeyMapper();
  private _sceneRoot!: SceneObject;
  private _stateSub: Unsubscribable | null = null;
  private _locationSub?: UnregisterCallback | null = null;
  private _lastPath?: string;
  private _ignoreNextLocationUpdate = false;
  private _urlParams: URLSearchParams | undefined;

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

    const location = locationService.getLocation();

    this._sceneRoot = root;
    this._lastPath = location.pathname;
    this._urlParams = new URLSearchParams(location.search);
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
    this._urlKeyMapper.rebuildIndex(this._sceneRoot);
    syncStateFromUrl(sceneObj, urlParams, this._urlKeyMapper);
  }

  private _onLocationUpdate = (location: Location) => {
    this._urlParams = new URLSearchParams(location.search);

    if (this._ignoreNextLocationUpdate) {
      this._ignoreNextLocationUpdate = false;
      return;
    }

    if (this._lastPath !== location.pathname) {
      return;
    }

    // Rebuild key mapper index before starting sync
    this._urlKeyMapper.rebuildIndex(this._sceneRoot);
    // Sync scene state tree from url
    syncStateFromUrl(this._sceneRoot, this._urlParams, this._urlKeyMapper);
    this._lastPath = location.pathname;
  };

  private _onStateChanged = ({ payload }: SceneObjectStateChangedEvent) => {
    const changedObject = payload.changedObject;

    if (changedObject.urlSync) {
      const newUrlState = changedObject.urlSync.getUrlState();

      const searchParams = locationService.getSearch();
      const mappedUpdated: SceneObjectUrlValues = {};

      this._urlKeyMapper.rebuildIndex(this._sceneRoot);

      for (const [key, newUrlValue] of Object.entries(newUrlState)) {
        const uniqueKey = this._urlKeyMapper.getUniqueKey(key, changedObject);
        const currentUrlValue = searchParams.getAll(uniqueKey);

        if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
          mappedUpdated[uniqueKey] = newUrlValue;
        }
      }

      if (Object.keys(mappedUpdated).length > 0) {
        this._ignoreNextLocationUpdate = true;
        locationService.partial(mappedUpdated, true);
      }
    }
  };

  public syncNewObj(obj: SceneObject) {
    syncStateFromUrl(obj, this._urlParams, this._urlKeyMapper);
  }

  public getUrlState(root: SceneObject): SceneObjectUrlValues {
    return getUrlState(root);
  }
}

let urlSyncManager: UrlSyncManagerLike | undefined;

export function getUrlSyncManager(): UrlSyncManagerLike {
  if (!urlSyncManager) {
    urlSyncManager = new UrlSyncManager();
  }

  return urlSyncManager;
}
