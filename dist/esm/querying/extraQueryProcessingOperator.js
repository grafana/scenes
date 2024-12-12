import { of, mergeMap, forkJoin, map } from 'rxjs';

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
const passthroughProcessor = (_, secondary) => of(secondary);
const extraQueryProcessingOperator = (processors) => (data) => {
  return data.pipe(
    mergeMap(([primary, ...secondaries]) => {
      const processedSecondaries = secondaries.flatMap((s) => {
        var _a, _b;
        return (_b = (_a = processors.get(s.request.requestId)) == null ? void 0 : _a(primary, s)) != null ? _b : of(s);
      });
      return forkJoin([of(primary), ...processedSecondaries]);
    }),
    map(([primary, ...processedSecondaries]) => {
      var _a;
      return __spreadProps(__spreadValues({}, primary), {
        series: [...primary.series, ...processedSecondaries.flatMap((s) => s.series)],
        annotations: [...(_a = primary.annotations) != null ? _a : [], ...processedSecondaries.flatMap((s) => {
          var _a2;
          return (_a2 = s.annotations) != null ? _a2 : [];
        })]
      });
    })
  );
};

export { extraQueryProcessingOperator, passthroughProcessor };
//# sourceMappingURL=extraQueryProcessingOperator.js.map
