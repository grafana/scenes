import { SceneObjectBase } from '../core/SceneObjectBase.js';

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
var _running;
function isQueryController(s) {
  return "isQueryController" in s;
}
class SceneQueryController extends SceneObjectBase {
  constructor() {
    super({ isRunning: false });
    this.isQueryController = true;
    __privateAdd(this, _running, /* @__PURE__ */ new Set());
    this.addActivationHandler(() => {
      return () => __privateGet(this, _running).clear();
    });
  }
  queryStarted(entry) {
    __privateGet(this, _running).add(entry);
    this.changeRunningQueryCount(1);
    if (!this.state.isRunning) {
      this.setState({ isRunning: true });
    }
  }
  queryCompleted(entry) {
    if (!__privateGet(this, _running).has(entry)) {
      return;
    }
    __privateGet(this, _running).delete(entry);
    this.changeRunningQueryCount(-1);
    if (__privateGet(this, _running).size === 0) {
      this.setState({ isRunning: false });
    }
  }
  changeRunningQueryCount(dir) {
    var _a;
    window.__grafanaRunningQueryCount = ((_a = window.__grafanaRunningQueryCount) != null ? _a : 0) + dir;
  }
  cancelAll() {
    var _a;
    for (const entry of __privateGet(this, _running).values()) {
      (_a = entry.cancel) == null ? void 0 : _a.call(entry);
    }
  }
}
_running = new WeakMap();

export { SceneQueryController, isQueryController };
//# sourceMappingURL=SceneQueryController.js.map
