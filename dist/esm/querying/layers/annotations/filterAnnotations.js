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
function filterAnnotations(data, filters) {
  var _a;
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }
  const rows = Array.from({ length: data.length }, () => /* @__PURE__ */ new Set());
  let frameIdx = 0;
  for (const frame of data) {
    for (let index = 0; index < frame.length; index++) {
      if (rows[frameIdx].has(index)) {
        continue;
      }
      let matching = true;
      const panelIdField = frame.fields.find((f) => f.name === "panelId");
      const sourceField = frame.fields.find((f) => f.name === "source");
      if (sourceField) {
        if (panelIdField && sourceField.values[index].type === "dashboard") {
          matching = panelIdField.values[index] === filters.panelId;
        }
        const sourceFilter = sourceField.values[index].filter;
        if (sourceFilter) {
          const includes = ((_a = sourceFilter.ids) != null ? _a : []).includes(filters.panelId);
          if (sourceFilter.exclude) {
            if (includes) {
              matching = false;
            }
          } else if (!includes) {
            matching = false;
          }
        }
      }
      if (matching) {
        rows[frameIdx].add(index);
      }
    }
    frameIdx++;
  }
  const processed = [];
  frameIdx = 0;
  for (const frame of data) {
    const frameLength = rows[frameIdx].size;
    const fields = [];
    for (const field of frame.fields) {
      const buffer = [];
      for (let index = 0; index < frame.length; index++) {
        if (rows[frameIdx].has(index)) {
          buffer.push(field.values[index]);
          continue;
        }
      }
      fields.push(__spreadProps(__spreadValues({}, field), {
        values: buffer
      }));
    }
    processed.push(__spreadProps(__spreadValues({}, frame), {
      fields,
      length: frameLength
    }));
    frameIdx++;
  }
  return processed;
}

export { filterAnnotations };
//# sourceMappingURL=filterAnnotations.js.map
