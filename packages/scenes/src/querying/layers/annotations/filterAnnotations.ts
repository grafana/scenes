import { DataFrame, Field } from '@grafana/data';
import { DataLayerFilter } from '../../../core/types';

const GLOBAL_ANNOTATION_ID = 0;

// Provided SceneDataLayerProviderResult is an array of DataFrames.
export function filterAnnotations(data: DataFrame[], filters: DataLayerFilter) {
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }

  const rows = Array.from({ length: data.length }, () => new Set<number>());

  let frameIdx = 0;
  for (const frame of data) {
    for (let index = 0; index < frame.length; index++) {
      if (rows[frameIdx].has(index)) {
        continue;
      }
      let matching = true;

      // Let's call those standard fields that annotations data frame has.
      // panelId is a standard field, but it's not always present. It's added to annotations that were added to a particular panel.
      const panelIdField = frame.fields.find((f) => f.name === 'panelId');
      // Source field contains annotation definition, with type and filters included.
      const sourceField = frame.fields.find((f) => f.name === 'source');

      if (sourceField) {
        // Here we are filtering Grafana annotations that were added to a particular panel.
        if (panelIdField && sourceField.values[index].type === 'dashboard') {
          matching = [filters.panelId, GLOBAL_ANNOTATION_ID].includes(panelIdField.values[index]);
        }

        const sourceFilter = sourceField.values[index].filter;

        // Here we are filtering based on annotation filter definition.
        // Those filters are: Show annotation in selected panels, Exclude annotation from selected panels.
        if (sourceFilter) {
          const includes = [...(sourceFilter.ids ?? []), GLOBAL_ANNOTATION_ID].includes(filters.panelId);
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

  const processed: DataFrame[] = [];

  frameIdx = 0;
  for (const frame of data) {
    const frameLength = rows[frameIdx].size;
    const fields: Field[] = [];

    for (const field of frame.fields) {
      const buffer = [];

      for (let index = 0; index < frame.length; index++) {
        if (rows[frameIdx].has(index)) {
          buffer.push(field.values[index]);
          continue;
        }
      }

      fields.push({
        ...field,
        values: buffer,
      });
    }

    processed.push({
      ...frame,
      fields: fields,
      length: frameLength,
    });
    frameIdx++;
  }

  return processed;
}
