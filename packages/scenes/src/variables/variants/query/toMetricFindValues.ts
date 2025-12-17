import {
  DataFrame,
  FieldType,
  getFieldDisplayName,
  getProcessedDataFrames,
  isDataFrame,
  MetricFindValue,
  PanelData,
} from '@grafana/data';
import { map, OperatorFunction } from 'rxjs';

interface MetricFindValueWithOptionalProperties extends MetricFindValue {
  properties?: Record<string, string>;
}

export function toMetricFindValues(
  valueProp?: string,
  textProp?: string
): OperatorFunction<PanelData, MetricFindValueWithOptionalProperties[]> {
  return (source) =>
    source.pipe(
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

        const indices = validateIndices(findFieldsIndices(frames, valueProp, textProp));

        const metrics: MetricFindValueWithOptionalProperties[] = [];

        for (const frame of frames) {
          for (let index = 0; index < frame.length; index++) {
            const fieldValue = (fieldIndex: number) =>
              fieldIndex !== -1 ? frame.fields[fieldIndex].values.get(index) : undefined;

            const value = fieldValue(indices.value);
            const text = fieldValue(indices.text);
            const expandable = fieldValue(indices.expandable);

            const properties: MetricFindValueWithOptionalProperties['properties'] = {};

            for (const p of indices.properties) {
              properties[p.name] = fieldValue(p.index);
            }

            let result: MetricFindValueWithOptionalProperties = { value, text, properties: properties };

            if (expandable !== undefined) {
              result.expandable = Boolean(expandable);
            }

            metrics.push(result);
          }
        }

        return metrics;
      })
    );
}

type Indices = {
  value: number;
  text: number;
  properties: Array<{ name: string; index: number }>;
  expandable: number;
};

function findFieldsIndices(frames: DataFrame[], valueProp?: string, textProp?: string): Indices {
  const indices: Indices = {
    value: -1,
    text: -1,
    expandable: -1,
    properties: [],
  };

  for (const frame of getProcessedDataFrames(frames)) {
    for (let index = 0; index < frame.fields.length; index++) {
      const field = frame.fields[index];
      const fieldName = getFieldDisplayName(field, frame, frames).toLowerCase();

      if (field.type === FieldType.string) {
        if (valueProp && fieldName === valueProp) {
          indices.value = index;
        }

        if (textProp && fieldName === textProp) {
          indices.text = index;
        }

        if (fieldName === 'value' && indices.value === -1) {
          indices.value = index;
        }

        if (fieldName === 'text' && indices.text === -1) {
          indices.text = index;
        }

        indices.properties.push({ name: fieldName, index });
        continue;
      }

      if (
        fieldName === 'expandable' &&
        (field.type === FieldType.boolean || field.type === FieldType.number) &&
        indices.expandable === -1
      ) {
        indices.expandable = index;
      }
    }
  }

  return indices;
}

function validateIndices(indices: Indices): Indices {
  const hasNoValueOrText = indices.value === -1 && indices.text === -1;

  if (!indices.properties.length) {
    throw new Error("Couldn't find any field of type string in the results");
  }

  // A single field of type string that is neither named "value" nor "text" is considered as "value"
  if (hasNoValueOrText) {
    indices.value = indices.properties[0].index;
    indices.text = indices.properties[0].index;
  }

  if (indices.value === -1 && indices.text !== -1) {
    indices.value = indices.text;
  }

  if (indices.text === -1 && indices.value !== -1) {
    indices.text = indices.value;
  }

  return indices;
}

function areMetricFindValues(data: any[]): data is MetricFindValue[] {
  if (!data) {
    return false;
  }

  if (!data.length) {
    return true;
  }

  const firstValue: any = data[0];

  if (isDataFrame(firstValue)) {
    return false;
  }

  for (const firstValueKey in firstValue) {
    if (!firstValue.hasOwnProperty(firstValueKey)) {
      continue;
    }

    const value = firstValue[firstValueKey];
    if (value !== null && typeof value !== 'string' && typeof value !== 'number') {
      continue;
    }

    const key = firstValueKey.toLowerCase();

    if (key === 'text' || key === 'value') {
      return true;
    }
  }

  return false;
}
