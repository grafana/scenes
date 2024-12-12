import { config } from '@grafana/runtime';
import { cloneDeep, partition, groupBy, map, every, find, head, concat } from 'lodash';

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
function postProcessQueryResult(annotation, results) {
  if (annotation.snapshotData) {
    annotation = cloneDeep(annotation);
    delete annotation.snapshotData;
  }
  const processed = results.map((item) => {
    var _a;
    const processedItem = __spreadValues({}, item);
    processedItem.source = annotation;
    processedItem.color = config.theme2.visualization.getColorByName(annotation.iconColor);
    processedItem.type = annotation.name;
    processedItem.isRegion = Boolean(processedItem.timeEnd && processedItem.time !== processedItem.timeEnd);
    switch ((_a = processedItem.newState) == null ? void 0 : _a.toLowerCase()) {
      case "pending":
        processedItem.color = "yellow";
        break;
      case "alerting":
        processedItem.color = "red";
        break;
      case "ok":
        processedItem.color = "green";
        break;
      case "normal":
        processedItem.color = "green";
        break;
      case "no_data":
        processedItem.color = "gray";
        break;
      case "nodata":
        processedItem.color = "gray";
        break;
    }
    return processedItem;
  });
  return processed;
}
function dedupAnnotations(annotations) {
  let dedup = [];
  const events = partition(annotations, "id");
  const eventsById = groupBy(events[0], "id");
  dedup = map(eventsById, (eventGroup) => {
    if (eventGroup.length > 1 && !every(eventGroup, isPanelAlert)) {
      return find(eventGroup, (event) => {
        return event.eventType !== "panel-alert";
      });
    } else {
      return head(eventGroup);
    }
  });
  dedup = concat(dedup, events[1]);
  return dedup;
}
function isPanelAlert(event) {
  return event.eventType === "panel-alert";
}

export { dedupAnnotations, postProcessQueryResult };
//# sourceMappingURL=utils.js.map
