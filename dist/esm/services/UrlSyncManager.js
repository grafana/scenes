import { locationService } from '@grafana/runtime';
import { SceneObjectStateChangedEvent } from '../core/events.js';
import { writeSceneLog } from '../utils/writeSceneLog.js';
import { Subscription } from 'rxjs';
import { UniqueUrlKeyMapper } from './UniqueUrlKeyMapper.js';
import { getUrlState, syncStateFromUrl, isUrlValueEqual } from './utils.js';
import { BusEventWithPayload } from '@grafana/data';
import { useMemo } from 'react';

var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _cache, _location;
class NewSceneObjectAddedEvent extends BusEventWithPayload {
}
NewSceneObjectAddedEvent.type = "new-scene-object-added";
class UrlSyncManager {
  constructor(_options = {}, locationService$1 = locationService) {
    this._urlKeyMapper = new UniqueUrlKeyMapper();
    this._options = _options;
    this._locationService = locationService$1;
    this._paramsCache = new UrlParamsCache(locationService$1);
  }
  initSync(root) {
    var _a;
    if (this._subs) {
      writeSceneLog("UrlSyncManager", "Unregister previous scene state subscription", (_a = this._sceneRoot) == null ? void 0 : _a.state.key);
      this._subs.unsubscribe();
    }
    writeSceneLog("UrlSyncManager", "init", root.state.key);
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
    this.handleNewObject(this._sceneRoot);
    if (this._options.updateUrlOnInit) {
      const urlState = getUrlState(root);
      if (isUrlStateDifferent(urlState, this._paramsCache.getParams())) {
        this._locationService.partial(urlState, true);
      }
    }
  }
  cleanUp(root) {
    if (this._sceneRoot !== root) {
      return;
    }
    writeSceneLog("UrlSyncManager", "Clean up");
    if (this._subs) {
      this._subs.unsubscribe();
      this._subs = void 0;
      writeSceneLog(
        "UrlSyncManager",
        "Root deactived, unsub to state",
        "same key",
        this._sceneRoot.state.key === root.state.key
      );
    }
    this._sceneRoot = void 0;
    this._lastLocation = void 0;
  }
  handleNewLocation(location) {
    if (!this._sceneRoot || this._lastLocation === location) {
      return;
    }
    writeSceneLog("UrlSyncManager", "handleNewLocation");
    this._lastLocation = location;
    syncStateFromUrl(this._sceneRoot, this._paramsCache.getParams(), this._urlKeyMapper);
  }
  handleNewObject(sceneObj) {
    if (!this._sceneRoot) {
      return;
    }
    syncStateFromUrl(sceneObj, this._paramsCache.getParams(), this._urlKeyMapper);
  }
  handleSceneObjectStateChanged(changedObject) {
    var _a, _b;
    if (!changedObject.urlSync) {
      return;
    }
    const newUrlState = changedObject.urlSync.getUrlState();
    const searchParams = this._locationService.getSearch();
    const mappedUpdated = {};
    for (const [key, newUrlValue] of Object.entries(newUrlState)) {
      const uniqueKey = this._urlKeyMapper.getUniqueKey(key, changedObject);
      const currentUrlValue = searchParams.getAll(uniqueKey);
      if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
        mappedUpdated[uniqueKey] = newUrlValue;
      }
    }
    if (Object.keys(mappedUpdated).length > 0) {
      const shouldCreateHistoryEntry = (_b = (_a = changedObject.urlSync).shouldCreateHistoryStep) == null ? void 0 : _b.call(_a, newUrlState);
      const shouldReplace = shouldCreateHistoryEntry !== true;
      writeSceneLog("UrlSyncManager", "onStateChange updating URL");
      this._locationService.partial(mappedUpdated, shouldReplace);
      this._lastLocation = this._locationService.getLocation();
    }
  }
  getUrlState(root) {
    return getUrlState(root);
  }
}
class UrlParamsCache {
  constructor(locationService) {
    this.locationService = locationService;
    __privateAdd(this, _cache, void 0);
    __privateAdd(this, _location, void 0);
  }
  getParams() {
    const location = this.locationService.getLocation();
    if (__privateGet(this, _location) === location) {
      return __privateGet(this, _cache);
    }
    __privateSet(this, _location, location);
    __privateSet(this, _cache, new URLSearchParams(location.search));
    return __privateGet(this, _cache);
  }
}
_cache = new WeakMap();
_location = new WeakMap();
function isUrlStateDifferent(sceneUrlState, currentParams) {
  for (let key in sceneUrlState) {
    if (!isUrlValueEqual(currentParams.getAll(key), sceneUrlState[key])) {
      return true;
    }
  }
  return false;
}
function useUrlSyncManager(options, locationService) {
  return useMemo(
    () => new UrlSyncManager(
      {
        updateUrlOnInit: options.updateUrlOnInit,
        createBrowserHistorySteps: options.createBrowserHistorySteps
      },
      locationService
    ),
    [options.updateUrlOnInit, options.createBrowserHistorySteps, locationService]
  );
}

export { NewSceneObjectAddedEvent, UrlSyncManager, useUrlSyncManager };
//# sourceMappingURL=UrlSyncManager.js.map
