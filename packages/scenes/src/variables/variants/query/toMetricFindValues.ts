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
  properties?: Record<string, any>;
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

        const indices = findFieldsIndices(frames);

        if (indices.value === -1 && indices.text === -1 && !indices.properties.length) {
          throw new Error("Couldn't find any field of type string in the results");
        }

        // a single field of type string that is neither named "value" nor "text" is considered as "value"
        if (indices.value === -1 && indices.text === -1 && indices.properties.length === 1) {
          indices.value = indices.properties[0].index;
          indices.properties = [];
        }

        if (indices.value === -1 && indices.text === -1 && indices.properties.length && !valueProp && !textProp) {
          throw new Error('Properties found in series but missing valueProp and textProp');
        }

        const metrics: MetricFindValueWithOptionalProperties[] = [];

        for (const frame of frames) {
          for (let index = 0; index < frame.length; index++) {
            const value = indices.value !== -1 ? frame.fields[indices.value].values.get(index) : '';
            const text = indices.text !== -1 ? frame.fields[indices.text].values.get(index) : '';
            const expandable =
              indices.expandable !== -1 ? frame.fields[indices.expandable].values.get(index) : undefined;

            if (!indices.properties.length) {
              metrics.push({
                value: value || text,
                text: text || value,
                expandable,
              });
              continue;
            }

            const properties = indices.properties.reduce((acc, p) => {
              acc[p.name] = frame.fields[p.index].values.get(index);
              return acc;
            }, {} as Record<string, string>);

            metrics.push({
              value:
                value ||
                (valueProp && properties[valueProp as string]) ||
                text ||
                (textProp && properties[textProp as string]),
              text:
                text ||
                (textProp && properties[textProp as string]) ||
                value ||
                (valueProp && properties[valueProp as string]),
              properties,
              expandable,
            });
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

function findFieldsIndices(frames: DataFrame[]): Indices {
  const indices: Indices = {
    value: -1,
    text: -1,
    properties: [],
    expandable: -1,
  };

  for (const frame of getProcessedDataFrames(frames)) {
    for (let index = 0; index < frame.fields.length; index++) {
      const field = frame.fields[index];
      const fieldName = getFieldDisplayName(field, frame, frames).toLowerCase();

      if (field.type === FieldType.string) {
        if (fieldName === 'value') {
          if (indices.value === -1) {
            indices.value = index;
          }
          continue;
        }

        if (fieldName === 'text') {
          if (indices.text === -1) {
            indices.text = index;
          }
          continue;
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

    if (
      firstValue[firstValueKey] !== null &&
      typeof firstValue[firstValueKey] !== 'string' &&
      typeof firstValue[firstValueKey] !== 'number'
    ) {
      continue;
    }

    const key = firstValueKey.toLowerCase();

    if (key === 'text' || key === 'value') {
      return true;
    }
  }

  return false;
}
