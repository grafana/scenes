import { TableFieldOptions as TableFieldConfig } from '@grafana/schema';

import {
  FieldConfig as BarChartFieldConfig,
  defaultFieldConfig as defaultBarChartFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { FieldConfig as HeatmapFieldConfig } from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import {
  FieldConfig as HistogramFieldConfig,
  defaultFieldConfig as defaultHistogramFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { FieldConfig as PieChartFieldConfig } from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import {
  FieldConfig as StateTimelineFieldConfig,
  defaultFieldConfig as defaultStateTimelineFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import {
  FieldConfig as StatusHistoryFieldConfig,
  defaultFieldConfig as defaultStatusHistoryFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { FieldConfig as TimeSeriesFieldConfig } from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import { FieldConfig as TrendFieldConfig } from '@grafana/schema/dist/esm/raw/composable/trend/panelcfg/x/TrendPanelCfg_types.gen';
import { defaultFieldConfig as defaultXYChartFieldConfig } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';
import { FieldConfigBuilder } from './FieldConfigBuilder';

export const FieldConfigBuilders = {
  barchart() {
    return new FieldConfigBuilder<BarChartFieldConfig>(() => defaultBarChartFieldConfig);
  },
  bargauge() {
    return new FieldConfigBuilder<{}>();
  },
  flamegraph() {
    return new FieldConfigBuilder<{}>();
  },
  gauge() {
    return new FieldConfigBuilder<{}>();
  },
  geomap() {
    return new FieldConfigBuilder<{}>();
  },
  heatmap() {
    return new FieldConfigBuilder<HeatmapFieldConfig>();
  },
  histogram() {
    return new FieldConfigBuilder<HistogramFieldConfig>(() => defaultHistogramFieldConfig);
  },
  logs() {
    return new FieldConfigBuilder<{}>();
  },
  news() {
    return new FieldConfigBuilder<{}>();
  },
  nodegraph() {
    return new FieldConfigBuilder<{}>();
  },
  piechart() {
    return new FieldConfigBuilder<PieChartFieldConfig>();
  },
  stat() {
    return new FieldConfigBuilder<{}>();
  },
  statetimeline() {
    return new FieldConfigBuilder<StateTimelineFieldConfig>(() => defaultStateTimelineFieldConfig);
  },
  statushistory() {
    return new FieldConfigBuilder<StatusHistoryFieldConfig>(() => defaultStatusHistoryFieldConfig);
  },
  table() {
    return new FieldConfigBuilder<TableFieldConfig>();
  },
  text() {
    return new FieldConfigBuilder<{}>();
  },
  timeseries() {
    return new FieldConfigBuilder<TimeSeriesFieldConfig>();
  },
  trend() {
    return new FieldConfigBuilder<{}>();
  },
  traces() {
    return new FieldConfigBuilder<TrendFieldConfig>();
  },
  xychart() {
    return new FieldConfigBuilder<{}>(() => defaultXYChartFieldConfig);
  },
};
