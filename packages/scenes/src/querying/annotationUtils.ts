import { AnnotationEvent } from '@grafana/data';

export function getAnnotationsByPanelId(annotations: AnnotationEvent[], panelId?: number) {
  return annotations.filter((item) => {
    if (panelId !== undefined && item.panelId && item.source?.type === 'dashboard') {
      return item.panelId === panelId;
    }
    return true;
  });
}
