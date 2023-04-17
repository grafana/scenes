import { AlertStateInfo, AnnotationEvent, PanelData, TimeRange } from '@grafana/data';

/**
 * Filtered by panel id result
 */
export interface DashboardQueryRunnerResult {
  annotations: AnnotationEvent[];
  alertState?: AlertStateInfo;
}

export interface AnnotationQueryResult {
  annotations: AnnotationEvent[];
  alertStates: AlertStateInfo[];
}

export interface AnnotationQueryOptions {
  //dashboard: Dashboard;
  //panel: PanelModel;
  range: TimeRange;
}

export interface AnnotationQueryResponse {
  /**
   * The processed annotation events
   */
  events?: AnnotationEvent[];

  /**
   * The original panel response
   */
  panelData?: PanelData;
}

export interface AnnotationTag {
  /**
   * The tag name
   */
  tag: string;
  /**
   * The number of occurrences of that tag
   */
  count: number;
}

export interface AnnotationTagsResponse {
  result: {
    tags: AnnotationTag[];
  };
}
