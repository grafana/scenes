import { AnnotationEventUIModel, CoreApp } from '@grafana/data';
import { AdHocFilterItem } from '@grafana/ui';

/**
 * Slimmed down interface that matches part of PanelContext from @grafana/data
 */
export interface VizPanelContext {
  /** Information on what the outer container is */
  app?: CoreApp | 'string';

  canAddAnnotations?: () => boolean;
  canEditAnnotations?: (dashboardUID?: string) => boolean;
  canDeleteAnnotations?: (dashboardUID?: string) => boolean;
  onAnnotationCreate?: (annotation: AnnotationEventUIModel) => void;
  onAnnotationUpdate?: (annotation: AnnotationEventUIModel) => void;
  onAnnotationDelete?: (id: string) => void;

  /**
   * Used from visualizations like Table to add ad-hoc filters from cell values
   */
  onAddAdHocFilter?: (item: AdHocFilterItem) => void;
}
