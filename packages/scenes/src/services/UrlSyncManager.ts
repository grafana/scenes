import { Location } from 'history';

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
  handleNewLocation(location: Location): void;
  handleNewObject(sceneObj: SceneObject): void;
}

export class UrlSyncManager implements UrlSyncManagerLike {
  private _urlKeyMapper = new UniqueUrlKeyMapper();
  private _sceneRoot?: SceneObject;
  private _stateSub: Unsubscribable | null = null;
  private _lastLocation: Location | undefined;
  private _paramsCache = new UrlParamsCache();

  /**
   * Updates the current scene state to match URL state.
   */
  public initSync(root: SceneObject) {
    if (this._stateSub) {
      writeSceneLog('UrlSyncManager', 'Unregister previous scene state subscription', this._sceneRoot?.state.key);
      this._stateSub.unsubscribe();
    }

    writeSceneLog('UrlSyncManager', 'init', root.state.key);

    this._sceneRoot = root;
    this._stateSub = root.subscribeToEvent(SceneObjectStateChangedEvent, this.#onStateChanged);

    this._urlKeyMapper.clear();
    this._lastLocation = locationService.getLocation();
    console.log('initSync', this._lastLocation.search);

    this.handleNewObject(this._sceneRoot);
  }

  public cleanUp(root: SceneObject) {
    // Ignore this if we have a new or different root
    if (this._sceneRoot !== root) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'Clean up');

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

    this._sceneRoot = undefined;
    this._lastLocation = undefined;
  }

  public handleNewLocation(location: Location) {
    if (!this._sceneRoot || this._lastLocation === location) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'handleNewLocation');

    this._lastLocation = location;

    // Sync scene state tree from url
    syncStateFromUrl(this._sceneRoot!, this._paramsCache.getParams(), this._urlKeyMapper);
  }

  public handleNewObject(sceneObj: SceneObject) {
    if (!this._sceneRoot) {
      return;
    }

    syncStateFromUrl(sceneObj, this._paramsCache.getParams(), this._urlKeyMapper);
  }

  #onStateChanged = ({ payload }: SceneObjectStateChangedEvent) => {
    const changedObject = payload.changedObject;

    if (changedObject.urlSync) {
      const newUrlState = changedObject.urlSync.getUrlState();

      const searchParams = locationService.getSearch();
      const mappedUpdated: SceneObjectUrlValues = {};

      for (const [key, newUrlValue] of Object.entries(newUrlState)) {
        const uniqueKey = this._urlKeyMapper.getUniqueKey(key, changedObject);
        const currentUrlValue = searchParams.getAll(uniqueKey);

        if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
          mappedUpdated[uniqueKey] = newUrlValue;
        }
      }

      if (Object.keys(mappedUpdated).length > 0) {
        writeSceneLog('UrlSyncManager', 'onStateChange updating URL');
        locationService.partial(mappedUpdated, true);

        /// Mark the location already handled
        this._lastLocation = locationService.getLocation();
      }
    }
  };

  public getUrlState(root: SceneObject): SceneObjectUrlValues {
    return getUrlState(root);
  }
}

class UrlParamsCache {
  #cache: URLSearchParams | undefined;
  #location: Location | undefined;

  public getParams(): URLSearchParams {
    const location = locationService.getLocation();

    if (this.#location === location) {
      return this.#cache!;
    }

    this.#location = location;
    this.#cache = new URLSearchParams(location.search);

    console.log('UrlParamsCache.getParams', this.#cache.toString());
    return this.#cache;
  }
}

let urlSyncManager: UrlSyncManagerLike | undefined;

export function getUrlSyncManager(): UrlSyncManagerLike {
  if (!urlSyncManager) {
    urlSyncManager = new UrlSyncManager();
  }

  return urlSyncManager;
}
