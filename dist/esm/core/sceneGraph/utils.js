import { SceneObjectBase } from '../SceneObjectBase.js';
import { SceneObjectRef } from '../SceneObjectRef.js';

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
function cloneSceneObject(sceneObject, withState) {
  const clonedState = cloneSceneObjectState(sceneObject.state, withState);
  return new sceneObject.constructor(clonedState);
}
function cloneSceneObjectState(sceneState, withState) {
  const clonedState = __spreadValues({}, sceneState);
  for (const key in clonedState) {
    const propValue = clonedState[key];
    if (propValue instanceof SceneObjectBase) {
      clonedState[key] = propValue.clone();
    }
    if (propValue instanceof SceneObjectRef) {
      throw new Error("Cannot clone a SceneObject with a SceneObjectRef in state");
    }
    if (Array.isArray(propValue)) {
      const newArray = [];
      for (const child of propValue) {
        if (child instanceof SceneObjectBase) {
          newArray.push(child.clone());
        } else {
          newArray.push(child);
        }
      }
      clonedState[key] = newArray;
    }
  }
  Object.assign(clonedState, withState);
  return clonedState;
}
function getClosest(sceneObject, extract) {
  let curSceneObject = sceneObject;
  let extracted = void 0;
  while (curSceneObject && !extracted) {
    extracted = extract(curSceneObject);
    curSceneObject = curSceneObject.parent;
  }
  return extracted;
}

export { cloneSceneObject, cloneSceneObjectState, getClosest };
//# sourceMappingURL=utils.js.map
