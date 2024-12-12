import React from 'react';
import { ReplaySubject } from 'rxjs';
import { emptyPanelData } from '../core/SceneDataNode.js';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { DataLayersMerger } from './DataLayersMerger.js';
import { setBaseClassState } from '../utils/utils.js';

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
class SceneDataLayerSetBase extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this.isDataLayer = true;
    this._results = new ReplaySubject(1);
    this._dataLayersMerger = new DataLayersMerger();
  }
  subscribeToAllLayers(layers) {
    if (layers.length > 0) {
      this.querySub = this._dataLayersMerger.getMergedStream(layers).subscribe(this._onLayerUpdateReceived.bind(this));
    } else {
      this._results.next({ origin: this, data: emptyPanelData });
      this.setStateHelper({ data: emptyPanelData });
    }
  }
  _onLayerUpdateReceived(results) {
    var _a;
    let series = [];
    for (const result of results) {
      if ((_a = result.data) == null ? void 0 : _a.series) {
        series = series.concat(result.data.series);
      }
    }
    const combinedData = __spreadProps(__spreadValues({}, emptyPanelData), { series });
    this._results.next({ origin: this, data: combinedData });
    this.setStateHelper({ data: combinedData });
  }
  getResultsStream() {
    return this._results;
  }
  cancelQuery() {
    var _a;
    (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
  }
  setStateHelper(state) {
    setBaseClassState(this, state);
  }
}
class SceneDataLayerSet extends SceneDataLayerSetBase {
  constructor(state) {
    var _a, _b;
    super({
      name: (_a = state.name) != null ? _a : "Data layers",
      layers: (_b = state.layers) != null ? _b : []
    });
    this.addActivationHandler(() => this._onActivate());
  }
  _onActivate() {
    this._subs.add(
      this.subscribeToState((newState, oldState) => {
        var _a;
        if (newState.layers !== oldState.layers) {
          (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
          this.subscribeToAllLayers(newState.layers);
        }
      })
    );
    this.subscribeToAllLayers(this.state.layers);
    return () => {
      var _a;
      (_a = this.querySub) == null ? void 0 : _a.unsubscribe();
    };
  }
}
SceneDataLayerSet.Component = ({ model }) => {
  const { layers } = model.useState();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, layers.map((layer) => /* @__PURE__ */ React.createElement(layer.Component, {
    model: layer,
    key: layer.state.key
  })));
};

export { SceneDataLayerSet, SceneDataLayerSetBase };
//# sourceMappingURL=SceneDataLayerSet.js.map
