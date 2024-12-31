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
var _ref;
class SceneObjectRef {
  constructor(ref) {
    __privateAdd(this, _ref, void 0);
    __privateSet(this, _ref, ref);
  }
  resolve() {
    return __privateGet(this, _ref);
  }
}
_ref = new WeakMap();

export { SceneObjectRef };
//# sourceMappingURL=SceneObjectRef.js.map
