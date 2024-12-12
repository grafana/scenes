import { getProcessedDataFrames, getFieldDisplayName, FieldType, isDataFrame } from '@grafana/data';
import { map } from 'rxjs';

function toMetricFindValues() {
  return (source) => source.pipe(
    map((panelData) => {
      const frames = panelData.series;
      if (!frames || !frames.length) {
        return [];
      }
      if (areMetricFindValues(frames)) {
        return frames;
      }
      if (frames[0].fields.length === 0) {
        return [];
      }
      const processedDataFrames = getProcessedDataFrames(frames);
      const metrics = [];
      let valueIndex = -1;
      let textIndex = -1;
      let stringIndex = -1;
      let expandableIndex = -1;
      for (const frame of processedDataFrames) {
        for (let index = 0; index < frame.fields.length; index++) {
          const field = frame.fields[index];
          const fieldName = getFieldDisplayName(field, frame, frames).toLowerCase();
          if (field.type === FieldType.string && stringIndex === -1) {
            stringIndex = index;
          }
          if (fieldName === "text" && field.type === FieldType.string && textIndex === -1) {
            textIndex = index;
          }
          if (fieldName === "value" && field.type === FieldType.string && valueIndex === -1) {
            valueIndex = index;
          }
          if (fieldName === "expandable" && (field.type === FieldType.boolean || field.type === FieldType.number) && expandableIndex === -1) {
            expandableIndex = index;
          }
        }
      }
      if (stringIndex === -1) {
        throw new Error("Couldn't find any field of type string in the results.");
      }
      for (const frame of frames) {
        for (let index = 0; index < frame.length; index++) {
          const expandable = expandableIndex !== -1 ? frame.fields[expandableIndex].values.get(index) : void 0;
          const string = frame.fields[stringIndex].values.get(index);
          const text = textIndex !== -1 ? frame.fields[textIndex].values.get(index) : null;
          const value = valueIndex !== -1 ? frame.fields[valueIndex].values.get(index) : null;
          if (valueIndex === -1 && textIndex === -1) {
            metrics.push({ text: string, value: string, expandable });
            continue;
          }
          if (valueIndex === -1 && textIndex !== -1) {
            metrics.push({ text, value: text, expandable });
            continue;
          }
          if (valueIndex !== -1 && textIndex === -1) {
            metrics.push({ text: value, value, expandable });
            continue;
          }
          metrics.push({ text, value, expandable });
        }
      }
      return metrics;
    })
  );
}
function areMetricFindValues(data) {
  if (!data) {
    return false;
  }
  if (!data.length) {
    return true;
  }
  const firstValue = data[0];
  if (isDataFrame(firstValue)) {
    return false;
  }
  for (const firstValueKey in firstValue) {
    if (!firstValue.hasOwnProperty(firstValueKey)) {
      continue;
    }
    if (firstValue[firstValueKey] !== null && typeof firstValue[firstValueKey] !== "string" && typeof firstValue[firstValueKey] !== "number") {
      continue;
    }
    const key = firstValueKey.toLowerCase();
    if (key === "text" || key === "value") {
      return true;
    }
  }
  return false;
}

export { toMetricFindValues };
//# sourceMappingURL=toMetricFindValues.js.map
