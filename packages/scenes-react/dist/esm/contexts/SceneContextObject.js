import { SceneObjectBase, NewSceneObjectAddedEvent, SceneVariableSet } from '@grafana/scenes';
import { writeSceneLog } from '../utils.js';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
class SceneContextObject extends SceneObjectBase {
  constructor(state) {
    var _a, _b;
    super(__spreadProps(__spreadValues({}, state), {
      children: (_a = state == null ? void 0 : state.children) != null ? _a : [],
      childContexts: (_b = state == null ? void 0 : state.childContexts) != null ? _b : []
    }));
  }
  addToScene(obj) {
    this.publishEvent(new NewSceneObjectAddedEvent(obj), true);
    this.setState({ children: [...this.state.children, obj] });
    writeSceneLog("SceneContext", `Adding to scene: ${obj.constructor.name} key: ${obj.state.key}`);
    const deactivate = obj.activate();
    return () => {
      writeSceneLog("SceneContext", `Removing from scene: ${obj.constructor.name} key: ${obj.state.key}`);
      this.setState({ children: this.state.children.filter((x) => x !== obj) });
      deactivate();
    };
  }
  findByKey(key) {
    return this.state.children.find((x) => x.state.key === key);
  }
  findVariable(name) {
    const variables = this.state.$variables;
    if (!variables) {
      return;
    }
    return variables.getByName(name);
  }
  addVariable(variable) {
    let set = this.state.$variables;
    this.publishEvent(new NewSceneObjectAddedEvent(variable), true);
    if (set) {
      set.setState({ variables: [...set.state.variables, variable] });
    } else {
      set = new SceneVariableSet({ variables: [variable] });
      this.setState({ $variables: set });
    }
    writeSceneLog("SceneContext", `Adding variable: ${variable.constructor.name} key: ${variable.state.key}`);
    return () => {
      set.setState({ variables: set.state.variables.filter((x) => x !== variable) });
      writeSceneLog("SceneContext", `Removing variable: ${variable.constructor.name} key: ${variable.state.key}`);
    };
  }
  addChildContext(ctx) {
    var _a;
    this.publishEvent(new NewSceneObjectAddedEvent(ctx), true);
    this.setState({ childContexts: [...(_a = this.state.childContexts) != null ? _a : [], ctx] });
    writeSceneLog("SceneContext", `Adding child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }
  removeChildContext(ctx) {
    var _a;
    this.setState({
      childContexts: (_a = this.state.childContexts) == null ? void 0 : _a.filter((context) => ctx !== context)
    });
    writeSceneLog("SceneContext", `Remvoing child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }
}

export { SceneContextObject };
//# sourceMappingURL=SceneContextObject.js.map
