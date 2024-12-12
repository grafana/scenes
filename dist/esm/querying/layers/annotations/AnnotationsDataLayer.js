import { arrayToDataFrame, DataTopic } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import React from 'react';
import { map } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode.js';
import { sceneGraph } from '../../../core/sceneGraph/index.js';
import { getDataSource } from '../../../utils/getDataSource.js';
import { getMessageFromError } from '../../../utils/getMessageFromError.js';
import { writeSceneLog } from '../../../utils/writeSceneLog.js';
import { registerQueryWithController } from '../../registerQueryWithController.js';
import { SceneDataLayerBase } from '../SceneDataLayerBase.js';
import { DataLayerControlSwitch } from '../SceneDataLayerControls.js';
import { executeAnnotationQuery } from './standardAnnotationQuery.js';
import { postProcessQueryResult, dedupAnnotations } from './utils.js';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject.js';
import { RefreshEvent } from '@grafana/runtime';

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
class AnnotationsDataLayer extends SceneDataLayerBase {
  constructor(initialState) {
    super(
      __spreadValues({
        isEnabled: true
      }, initialState),
      ["query"]
    );
    this._scopedVars = {
      __sceneObject: wrapInSafeSerializableSceneObject(this)
    };
  }
  onEnable() {
    this.publishEvent(new RefreshEvent(), true);
    const timeRange = sceneGraph.getTimeRange(this);
    this._timeRangeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });
  }
  onDisable() {
    var _a;
    this.publishEvent(new RefreshEvent(), true);
    (_a = this._timeRangeSub) == null ? void 0 : _a.unsubscribe();
  }
  runLayer() {
    writeSceneLog("AnnotationsDataLayer", "run layer");
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }
  async runWithTimeRange(timeRange) {
    const { query } = this.state;
    if (this.querySub) {
      this.querySub.unsubscribe();
    }
    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog("AnnotationsDataLayer", "Variable dependency is in loading state, skipping query execution");
      return;
    }
    try {
      const ds = await this.resolveDataSource(query);
      let stream = executeAnnotationQuery(ds, timeRange, query, this).pipe(
        registerQueryWithController({
          type: "annotations",
          origin: this,
          cancel: () => this.cancelQuery()
        }),
        map((events) => {
          const stateUpdate = this.processEvents(query, events);
          return stateUpdate;
        })
      );
      this.querySub = stream.subscribe((stateUpdate) => {
        this.publishResults(stateUpdate);
      });
    } catch (e) {
      this.publishResults(__spreadProps(__spreadValues({}, emptyPanelData), {
        state: LoadingState.Error,
        errors: [
          {
            message: getMessageFromError(e)
          }
        ]
      }));
      console.error("AnnotationsDataLayer error", e);
    }
  }
  async resolveDataSource(query) {
    return await getDataSource(query.datasource || void 0, this._scopedVars);
  }
  processEvents(query, events) {
    let processedEvents = postProcessQueryResult(query, events.events || []);
    processedEvents = dedupAnnotations(processedEvents);
    const stateUpdate = __spreadProps(__spreadValues({}, emptyPanelData), { state: events.state });
    const df = arrayToDataFrame(processedEvents);
    df.meta = __spreadProps(__spreadValues({}, df.meta), {
      dataTopic: DataTopic.Annotations
    });
    stateUpdate.series = [df];
    return stateUpdate;
  }
}
AnnotationsDataLayer.Component = AnnotationsDataLayerRenderer;
function AnnotationsDataLayerRenderer({ model }) {
  const { isHidden } = model.useState();
  if (isHidden) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(DataLayerControlSwitch, {
    layer: model
  });
}

export { AnnotationsDataLayer };
//# sourceMappingURL=AnnotationsDataLayer.js.map
