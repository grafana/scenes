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
var _value;
class SafeSerializableSceneObject {
  constructor(value) {
    __privateAdd(this, _value, void 0);
    this.text = "__sceneObject";
    this.valueOf = () => {
      return __privateGet(this, _value);
    };
    __privateSet(this, _value, value);
  }
  toString() {
    return void 0;
  }
  get value() {
    return this;
  }
}
_value = new WeakMap();

export { SafeSerializableSceneObject };
//# sourceMappingURL=SafeSerializableSceneObject.js.map
