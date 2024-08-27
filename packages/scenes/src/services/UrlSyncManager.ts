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
  handleNewLocation(location: Location): void;
  handleNewObject(sceneObj: SceneObject): void;
}

export interface UrlSyncManagerOptions {
  /**
   * This will update the url to contain all scene url state
   * when the scene is initialized.
   */
  updateUrlOnInit?: boolean;
  /**
   * This is only supported by some objects if they implement
   * shouldCreateHistoryStep where they can control what changes
   * url changes should add a new browser history entry.
   */
  createBrowserHistoryStep?: boolean;
}

export class UrlSyncManager implements UrlSyncManagerLike {
  private _urlKeyMapper = new UniqueUrlKeyMapper();
  private _sceneRoot?: SceneObject;
  private _stateSub: Unsubscribable | null = null;
  private _lastLocation: Location | undefined;
  private _paramsCache = new UrlParamsCache();
  private _options: UrlSyncManagerOptions;

  public constructor(_options: UrlSyncManagerOptions = {}) {
    this._options = _options;
  }

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

    // Sync current url with state
    this.handleNewObject(this._sceneRoot);

    // Get current url state and update url to match
    const urlState = getUrlState(root);

    if (isUrlStateDifferent(urlState, this._paramsCache.getParams())) {
      locationService.partial(urlState, true);
    }
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
        const shouldCreateHistoryEntry = changedObject.urlSync.shouldCreateHistoryStep?.(newUrlState);
        const shouldReplace = shouldCreateHistoryEntry !== true;

        writeSceneLog('UrlSyncManager', 'onStateChange updating URL');
        locationService.partial(mappedUpdated, shouldReplace);

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

    return this.#cache;
  }
}

function isUrlStateDifferent(sceneUrlState: SceneObjectUrlValues, currentParams: URLSearchParams) {
  for (let key in sceneUrlState) {
    if (!isUrlValueEqual(currentParams.getAll(key), sceneUrlState[key])) {
      return true;
    }
  }

  return false;
}

let urlSyncManager: UrlSyncManagerLike | undefined;

export function getUrlSyncManager(): UrlSyncManagerLike {
  if (!urlSyncManager) {
    urlSyncManager = new UrlSyncManager();
  }

  return urlSyncManager;
}
