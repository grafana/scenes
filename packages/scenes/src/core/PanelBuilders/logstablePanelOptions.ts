import * as common from '@grafana/schema';

/** Panel options for the alpha `logstable` visualization (matches Grafana panelcfg). */
export interface LogstableOptions {
  buildLinkToLogLine?: unknown;
  displayedFields?: string[];
  fieldSelectorWidth?: number;
  permalinkedLogId?: string;
  showControls?: boolean;
  showCopyLogLink?: boolean;
  showInspectLogLine?: boolean;
  sortOrder?: common.LogsSortOrder;
}

export const defaultLogstableOptions: Partial<LogstableOptions> = {
  displayedFields: [],
  fieldSelectorWidth: 220,
  showControls: true,
  showCopyLogLink: false,
  showInspectLogLine: true,
  sortOrder: common.LogsSortOrder.Descending,
};
