import { DataTopic, transformDataFrame, LoadingState } from '@grafana/data';
import { toDataQueryError } from '@grafana/runtime';
import { ReplaySubject, forkJoin, map, catchError, of } from 'rxjs';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig.js';
import { SceneDataLayerSet } from './SceneDataLayerSet.js';

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
class SceneDataTransformer extends SceneObjectBase {
  constructor(state) {
    super(state);
    this._results = new ReplaySubject(1);
    this._variableDependency = new VariableDependencyConfig(
      this,
      {
        statePaths: ["transformations"],
        onReferencedVariableValueChanged: () => this.reprocessTransformations()
      }
    );
    this.addActivationHandler(() => this.activationHandler());
  }
  activationHandler() {
    const sourceData = this.getSourceData();
    this._subs.add(sourceData.subscribeToState((state) => this.transform(state.data)));
    if (sourceData.state.data) {
      this.transform(sourceData.state.data);
    }
    return () => {
      if (this._transformSub) {
        this._transformSub.unsubscribe();
      }
    };
  }
  getSourceData() {
    if (this.state.$data) {
      if (this.state.$data instanceof SceneDataLayerSet) {
        throw new Error("SceneDataLayerSet can not be used as data provider for SceneDataTransformer.");
      }
      return this.state.$data;
    }
    if (!this.parent || !this.parent.parent) {
      throw new Error("SceneDataTransformer must either have $data set on it or have a parent.parent with $data");
    }
    return sceneGraph.getData(this.parent.parent);
  }
  setContainerWidth(width) {
    if (this.state.$data && this.state.$data.setContainerWidth) {
      this.state.$data.setContainerWidth(width);
    }
  }
  isDataReadyToDisplay() {
    const dataObject = this.getSourceData();
    if (dataObject.isDataReadyToDisplay) {
      return dataObject.isDataReadyToDisplay();
    }
    return true;
  }
  reprocessTransformations() {
    this.transform(this.getSourceData().state.data, true);
  }
  cancelQuery() {
    var _a, _b;
    (_b = (_a = this.getSourceData()).cancelQuery) == null ? void 0 : _b.call(_a);
  }
  getResultsStream() {
    return this._results;
  }
  clone(withState) {
    const clone = super.clone(withState);
    if (this._prevDataFromSource) {
      clone["_prevDataFromSource"] = this._prevDataFromSource;
    }
    return clone;
  }
  haveAlreadyTransformedData(data) {
    if (!this._prevDataFromSource) {
      return false;
    }
    if (data === this._prevDataFromSource) {
      return true;
    }
    const { series, annotations } = this._prevDataFromSource;
    if (data.series === series && data.annotations === annotations) {
      if (this.state.data && data.state !== this.state.data.state) {
        this.setState({ data: __spreadProps(__spreadValues({}, this.state.data), { state: data.state }) });
      }
      return true;
    }
    return false;
  }
  transform(data, force = false) {
    var _a;
    if (this.state.transformations.length === 0 || !data) {
      this._prevDataFromSource = data;
      this.setState({ data });
      if (data) {
        this._results.next({ origin: this, data });
      }
      return;
    }
    if (!force && this.haveAlreadyTransformedData(data)) {
      return;
    }
    const seriesTransformations = this.state.transformations.filter((transformation) => {
      if ("options" in transformation || "topic" in transformation) {
        return transformation.topic == null || transformation.topic === DataTopic.Series;
      }
      return true;
    }).map((transformation) => "operator" in transformation ? transformation.operator : transformation);
    const annotationsTransformations = this.state.transformations.filter((transformation) => {
      if ("options" in transformation || "topic" in transformation) {
        return transformation.topic === DataTopic.Annotations;
      }
      return false;
    }).map((transformation) => "operator" in transformation ? transformation.operator : transformation);
    if (this._transformSub) {
      this._transformSub.unsubscribe();
    }
    const ctx = {
      interpolate: (value) => {
        var _a2;
        return sceneGraph.interpolate(this, value, (_a2 = data.request) == null ? void 0 : _a2.scopedVars);
      }
    };
    let streams = [transformDataFrame(seriesTransformations, data.series, ctx)];
    if (data.annotations && data.annotations.length > 0 && annotationsTransformations.length > 0) {
      streams.push(transformDataFrame(annotationsTransformations, (_a = data.annotations) != null ? _a : []));
    }
    this._transformSub = forkJoin(streams).pipe(
      map((values) => {
        const transformedSeries = values[0];
        const transformedAnnotations = values[1];
        return __spreadProps(__spreadValues({}, data), {
          series: transformedSeries,
          annotations: transformedAnnotations != null ? transformedAnnotations : data.annotations
        });
      }),
      catchError((err) => {
        var _a2;
        console.error("Error transforming data: ", err);
        const sourceErr = ((_a2 = this.getSourceData().state.data) == null ? void 0 : _a2.errors) || [];
        const transformationError = toDataQueryError(err);
        transformationError.message = `Error transforming data: ${transformationError.message}`;
        const result = __spreadProps(__spreadValues({}, data), {
          state: LoadingState.Error,
          errors: [...sourceErr, transformationError]
        });
        return of(result);
      })
    ).subscribe((transformedData) => {
      this.setState({ data: transformedData });
      this._results.next({ origin: this, data: transformedData });
      this._prevDataFromSource = data;
    });
  }
}

export { SceneDataTransformer };
//# sourceMappingURL=SceneDataTransformer.js.map
