// These opt outs are here only for quicker and easier migration to react based annotations editors and because
// annotation support API needs some work to support less "standard" editors like prometheus and here it is not
// polluting public API.

import { AnnotationEvent, AnnotationQuery, DataSourceApi } from '@grafana/data';
import { config } from '@grafana/runtime';
import { cloneDeep, concat, every, find, groupBy, head, map, partition } from 'lodash';

const legacyRunner = [
  'prometheus',
  'loki',
  'elasticsearch',
  'grafana-opensearch-datasource', // external
];

/**
 * Use legacy runner. Used only as an escape hatch for easier transition to React based annotation editor.
 */
export function shouldUseLegacyRunner(datasource: DataSourceApi): boolean {
  const { type } = datasource;
  return !datasource.annotations || legacyRunner.includes(type);
}

export function postProcessQueryResult(annotation: AnnotationQuery, results: AnnotationEvent[]): AnnotationEvent[] {
  // if annotation has snapshotData
  // make clone and remove it
  if (annotation.snapshotData) {
    annotation = cloneDeep(annotation);
    delete annotation.snapshotData;
  }

  //
  const processed = results.map((item) => {
    const processedItem = { ...item };

    processedItem.source = annotation;
    processedItem.color = config.theme2.visualization.getColorByName(annotation.iconColor);
    processedItem.type = annotation.name;
    processedItem.isRegion = Boolean(processedItem.timeEnd && processedItem.time !== processedItem.timeEnd);

    switch (processedItem.newState?.toLowerCase()) {
      case 'pending':
        processedItem.color = 'yellow';
        break;
      case 'alerting':
        processedItem.color = 'red';
        break;
      case 'ok':
        processedItem.color = 'green';
        break;
      case 'normal': // ngalert ("normal" instead of "ok")
        processedItem.color = 'green';
        break;
      case 'no_data':
        processedItem.color = 'gray';
        break;
      case 'nodata': // ngalert
        processedItem.color = 'gray';
        break;
    }

    return processedItem;
  });

  return processed;
}

export function dedupAnnotations(annotations: any) {
  let dedup = [];

  // Split events by annotationId property existence
  const events = partition(annotations, 'id');

  const eventsById = groupBy(events[0], 'id');
  dedup = map(eventsById, (eventGroup) => {
    if (eventGroup.length > 1 && !every(eventGroup, isPanelAlert)) {
      // Get first non-panel alert
      return find(eventGroup, (event) => {
        return event.eventType !== 'panel-alert';
      });
    } else {
      return head(eventGroup);
    }
  });

  dedup = concat(dedup, events[1]);
  return dedup;
}

function isPanelAlert(event: { eventType: string }) {
  return event.eventType === 'panel-alert';
}
