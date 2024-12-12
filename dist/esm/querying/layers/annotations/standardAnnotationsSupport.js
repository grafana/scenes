import { isString } from 'lodash';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { FieldType, getFieldDisplayName, AnnotationEventFieldSource, standardTransformers } from '@grafana/data';
import { config } from '@grafana/runtime';

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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const standardAnnotationSupport = {
  prepareAnnotation: (json) => {
    if (isString(json == null ? void 0 : json.query)) {
      const _a = json, { query } = _a, rest = __objRest(_a, ["query"]);
      return __spreadProps(__spreadValues({}, rest), {
        target: {
          refId: "annotation_query",
          query
        },
        mappings: {}
      });
    }
    return json;
  },
  prepareQuery: (anno) => anno.target,
  processEvents: (anno, data) => {
    return getAnnotationsFromData(data, anno.mappings);
  }
};
function singleFrameFromPanelData() {
  return (source) => source.pipe(
    mergeMap((data) => {
      if (!(data == null ? void 0 : data.length)) {
        return of(void 0);
      }
      if (data.length === 1) {
        return of(data[0]);
      }
      const ctx = {
        interpolate: (v) => v
      };
      return of(data).pipe(
        standardTransformers.mergeTransformer.operator({}, ctx),
        map((d) => d[0])
      );
    })
  );
}
const annotationEventNames = [
  {
    key: "time",
    field: (frame) => frame.fields.find((f) => f.type === FieldType.time),
    placeholder: "time, or the first time field"
  },
  { key: "timeEnd", help: "When this field is defined, the annotation will be treated as a range" },
  {
    key: "title"
  },
  {
    key: "text",
    field: (frame) => frame.fields.find((f) => f.type === FieldType.string),
    placeholder: "text, or the first text field"
  },
  { key: "tags", split: ",", help: "The results will be split on comma (,)" },
  {
    key: "id"
  }
];
const publicDashboardEventNames = [
  {
    key: "color"
  },
  {
    key: "isRegion"
  },
  {
    key: "source"
  }
];
const alertEventAndAnnotationFields = [
  ...config.publicDashboardAccessToken ? publicDashboardEventNames : [],
  ...annotationEventNames,
  { key: "userId" },
  { key: "login" },
  { key: "email" },
  { key: "prevState" },
  { key: "newState" },
  { key: "data" },
  { key: "panelId" },
  { key: "alertId" },
  { key: "dashboardId" },
  { key: "dashboardUID" }
];
function getAnnotationsFromData(data, options) {
  return of(data).pipe(
    singleFrameFromPanelData(),
    map((frame) => {
      if (!(frame == null ? void 0 : frame.length)) {
        return [];
      }
      let hasTime = false;
      let hasText = false;
      const byName = {};
      for (const f of frame.fields) {
        const name = getFieldDisplayName(f, frame);
        byName[name.toLowerCase()] = f;
      }
      if (!options) {
        options = {};
      }
      const fields = [];
      for (const evts of alertEventAndAnnotationFields) {
        const opt = options[evts.key] || {};
        if (opt.source === AnnotationEventFieldSource.Skip) {
          continue;
        }
        const setter = { key: evts.key, split: evts.split };
        if (opt.source === AnnotationEventFieldSource.Text) {
          setter.text = opt.value;
        } else {
          const lower = (opt.value || evts.key).toLowerCase();
          setter.field = byName[lower];
          if (!setter.field && evts.field) {
            setter.field = evts.field(frame);
          }
        }
        if (setter.field || setter.text) {
          fields.push(setter);
          if (setter.key === "time") {
            hasTime = true;
          } else if (setter.key === "text") {
            hasText = true;
          }
        }
      }
      if (!hasTime || !hasText) {
        console.error("Cannot process annotation fields. No time or text present.");
        return [];
      }
      const events = [];
      for (let i = 0; i < frame.length; i++) {
        const anno = {
          type: "default",
          color: "red"
        };
        for (const f of fields) {
          let v = void 0;
          if (f.text) {
            v = f.text;
          } else if (f.field) {
            v = f.field.values.get(i);
            if (v !== void 0 && f.regex) {
              const match = f.regex.exec(v);
              if (match) {
                v = match[1] ? match[1] : match[0];
              }
            }
          }
          if (v !== null && v !== void 0) {
            if (f.split && typeof v === "string") {
              v = v.split(",");
            }
            anno[f.key] = v;
          }
        }
        events.push(anno);
      }
      return events;
    })
  );
}
const legacyRunner = [
  "prometheus",
  "loki",
  "elasticsearch",
  "grafana-opensearch-datasource"
];
function shouldUseLegacyRunner(datasource) {
  const { type } = datasource;
  return !datasource.annotations || legacyRunner.includes(type);
}

export { annotationEventNames, getAnnotationsFromData, publicDashboardEventNames, shouldUseLegacyRunner, singleFrameFromPanelData, standardAnnotationSupport };
//# sourceMappingURL=standardAnnotationsSupport.js.map
