import { Location } from 'history';

import { LocationService, locationService as locationServiceRuntime } from '@grafana/runtime';

import { SceneObjectStateChangedEvent } from '../core/events';
import { SceneObject, SceneObjectUrlValues, SceneUrlSyncOptions } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { Subscription } from 'rxjs';
import { UniqueUrlKeyMapper } from './UniqueUrlKeyMapper';
import { getUrlState, isUrlValueEqual, syncStateFromUrl } from './utils';
import { BusEventWithPayload } from '@grafana/data';
import { useMemo } from 'react';

export interface UrlSyncManagerLike {
  initSync(root: SceneObject): void;
  cleanUp(root: SceneObject): void;
  handleNewLocation(location: Location): void;
  handleNewObject(sceneObj: SceneObject): void;
}

/**
 * Notify the url sync manager of a new object that has been added to the scene
 * that needs to init state from URL.
 */
export class NewSceneObjectAddedEvent extends BusEventWithPayload<SceneObject> {
  public static readonly type = 'new-scene-object-added';
}

export class UrlSyncManager implements UrlSyncManagerLike {
  private _urlKeyMapper: UniqueUrlKeyMapper;
  private _sceneRoot?: SceneObject;
  private _subs: Subscription | undefined;
  private _lastLocation: Location | undefined;
  private _locationService: LocationService;
  private _paramsCache: UrlParamsCache;
  private _options: SceneUrlSyncOptions;

  public constructor(_options: SceneUrlSyncOptions = {}, locationService: LocationService = locationServiceRuntime) {
    this._options = _options;
    this._locationService = locationService;
    this._paramsCache = new UrlParamsCache(locationService);

    this._urlKeyMapper = new UniqueUrlKeyMapper({
      namespace: _options.namespace,
      excludeFromNamespace: _options.excludeFromNamespace,
    });
  }

  /**
   * Updates the current scene state to match URL state.
   */
  public initSync(root: SceneObject) {
    if (this._subs) {
      writeSceneLog('UrlSyncManager', 'Unregister previous scene state subscription', this._sceneRoot?.state.key);
      this._subs.unsubscribe();
    }

    writeSceneLog('UrlSyncManager', 'init', root.state.key);

    this._sceneRoot = root;
    this._subs = new Subscription();

    this._subs.add(
      root.subscribeToEvent(SceneObjectStateChangedEvent, (evt) => {
        this.handleSceneObjectStateChanged(evt.payload.changedObject);
      })
    );

    this._subs.add(
      root.subscribeToEvent(NewSceneObjectAddedEvent, (evt) => {
        this.handleNewObject(evt.payload);
      })
    );

    this._urlKeyMapper.clear();
    this._lastLocation = this._locationService.getLocation();

    // Sync current url with state
    this.handleNewObject(this._sceneRoot);

    if (this._options.updateUrlOnInit) {
      // Get current url state and update url to match
      const urlState = getUrlState(root, this._urlKeyMapper.getOptions());

      if (isUrlStateDifferent(urlState, this._paramsCache.getParams())) {
        this._locationService.partial(urlState, true);
      }
    }
  }

  public cleanUp(root: SceneObject) {
    // Ignore this if we have a new or different root
    if (this._sceneRoot !== root) {
      return;
    }

    writeSceneLog('UrlSyncManager', 'Clean up');

    if (this._subs) {
      this._subs.unsubscribe();
      this._subs = undefined;

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

  private handleSceneObjectStateChanged(changedObject: SceneObject) {
    if (!changedObject.urlSync) {
      return;
    }

    const newUrlState = changedObject.urlSync.getUrlState();

    const searchParams = this._locationService.getSearch();
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
      this._locationService.partial(mappedUpdated, shouldReplace);

      /// Mark the location already handled
      this._lastLocation = this._locationService.getLocation();
    }
  }

  public getUrlState(root: SceneObject): SceneObjectUrlValues {
    return getUrlState(root, this._urlKeyMapper.getOptions());
  }
}

class UrlParamsCache {
  #cache: URLSearchParams | undefined;
  #location: Location | undefined;

  public constructor(private locationService: LocationService) {}

  public getParams(): URLSearchParams {
    const location = this.locationService.getLocation();

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

/**
 * Creates a new memoized instance of the UrlSyncManager based on options
 */
export function useUrlSyncManager(options: SceneUrlSyncOptions, locationService: LocationService): UrlSyncManagerLike {
  return useMemo(
    () =>
      new UrlSyncManager(
        {
          updateUrlOnInit: options.updateUrlOnInit,
          createBrowserHistorySteps: options.createBrowserHistorySteps,
          namespace: options.namespace,
          excludeFromNamespace: options.excludeFromNamespace,
        },
        locationService
      ),
    [
      options.updateUrlOnInit,
      options.createBrowserHistorySteps,
      options.namespace,
      options.excludeFromNamespace,
      locationService,
    ]
  );
}
