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
  #urlKeyMapper = new UniqueUrlKeyMapper();
  #sceneRoot?: SceneObject;
  #stateSub: Unsubscribable | null = null;
  #lastLocation: Location | undefined;
  #paramsCache = new UrlParamsCache();

  /**
   * Updates the current scene state to match URL state.
   */
  public initSync(root: SceneObject) {
    if (this.#stateSub) {
      writeSceneLog('UrlSyncManager', 'Unregister previous scene state subscription', this.#sceneRoot?.state.key);
      this.#stateSub.unsubscribe();
    }

    writeSceneLog('UrlSyncManager', 'init', root.state.key);

    this.#sceneRoot = root;
    this.#stateSub = root.subscribeToEvent(SceneObjectStateChangedEvent, this.#onStateChanged);

    this.#urlKeyMapper.clear();
    this.#lastLocation = locationService.getLocation();

    this.handleNewObject(this.#sceneRoot);
  }

  public cleanUp(root: SceneObject) {
    // Ignore this if we have a new or different root
    if (this.#sceneRoot !== root) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'Clean up');

    if (this.#stateSub) {
      this.#stateSub.unsubscribe();
      this.#stateSub = null;
      writeSceneLog(
        'UrlSyncManager',
        'Root deactived, unsub to state',
        'same key',
        this.#sceneRoot.state.key === root.state.key
      );
    }

    this.#sceneRoot = undefined;
    this.#lastLocation = undefined;
  }

  public handleNewLocation(location: Location) {
    if (!this.#sceneRoot || this.#lastLocation === location) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'handleNewLocation');

    this.#lastLocation = location;

    // Sync scene state tree from url
    syncStateFromUrl(this.#sceneRoot!, this.#paramsCache.getParams(), this.#urlKeyMapper);
  }

  public handleNewObject(sceneObj: SceneObject) {
    if (!this.#sceneRoot) {
      return;
    }

    syncStateFromUrl(sceneObj, this.#paramsCache.getParams(), this.#urlKeyMapper);
  }

  #onStateChanged = ({ payload }: SceneObjectStateChangedEvent) => {
    const changedObject = payload.changedObject;

    if (changedObject.urlSync) {
      const newUrlState = changedObject.urlSync.getUrlState();

      const searchParams = locationService.getSearch();
      const mappedUpdated: SceneObjectUrlValues = {};

      for (const [key, newUrlValue] of Object.entries(newUrlState)) {
        const uniqueKey = this.#urlKeyMapper.getUniqueKey(key, changedObject);
        const currentUrlValue = searchParams.getAll(uniqueKey);

        if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
          mappedUpdated[uniqueKey] = newUrlValue;
        }
      }

      if (Object.keys(mappedUpdated).length > 0) {
        writeSceneLog('UrlSyncManager', 'onStateChange updating URL');
        locationService.partial(mappedUpdated, true);

        /// Mark the location already handled
        this.#lastLocation = locationService.getLocation();
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

let urlSyncManager: UrlSyncManagerLike | undefined;

export function getUrlSyncManager(): UrlSyncManagerLike {
  if (!urlSyncManager) {
    urlSyncManager = new UrlSyncManager();
  }

  return urlSyncManager;
}
