import { TableFieldOptions as TableFieldConfig } from '@grafana/schema';

import {
  Options as BarChartOptions,
  FieldConfig as BarChartFieldConfig,
  defaultOptions as defaultBarChartOptions,
  defaultFieldConfig as defaultBarChartFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import {
  Options as BarGaugeOptions,
  defaultOptions as defaultBarGaugeOptions,
} from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import {
  Options as GaugeOptions,
  defaultOptions as defaultGaugeOptions,
} from '@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen';
import {
  Options as GeomapOptions,
  defaultOptions as defaultGeomapOptions,
} from '@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeomapPanelCfg_types.gen';
import {
  Options as HeatmapOptions,
  FieldConfig as HeatmapFieldConfig,
  defaultOptions as defaultHeatmapOptions,
} from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import {
  Options as HistogramOptions,
  FieldConfig as HistogramFieldConfig,
  defaultOptions as defaultHistogramOptions,
  defaultFieldConfig as defaultHistogramFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { Options as LogsOptions } from '@grafana/schema/dist/esm/raw/composable/logs/panelcfg/x/LogsPanelCfg_types.gen';
import {
  Options as NewsOptions,
  defaultOptions as defaultNewsOptions,
} from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { Options as NodeGraphOptions } from '@grafana/schema/dist/esm/raw/composable/nodegraph/panelcfg/x/NodeGraphPanelCfg_types.gen';
import {
  Options as PieChartOptions,
  FieldConfig as PieChartFieldConfig,
  defaultOptions as defaultPieChartOptions,
} from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import {
  Options as StatOptions,
  defaultOptions as defaultStatOptions,
} from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import {
  Options as StateTimelineOptions,
  FieldConfig as StateTimelineFieldConfig,
  defaultOptions as defaultStateTimelineOptions,
  defaultFieldConfig as defaultStateTimelineFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import {
  Options as StatusHistoryOptions,
  FieldConfig as StatusHistoryFieldConfig,
  defaultOptions as defaultStatusHistoryOptions,
  defaultFieldConfig as defaultStatusHistoryFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import {
  Options as TableOptions,
  defaultOptions as defaultTableOptions,
} from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import {
  Options as TextOptions,
  defaultOptions as defaultTextOptions,
} from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import {
  Options as TimeSeriesOptions,
  FieldConfig as TimeSeriesFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import {
  Options as TrendOptions,
  FieldConfig as TrendFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/trend/panelcfg/x/TrendPanelCfg_types.gen';
import {
  Options as XYChartOptions,
  defaultOptions as defaultXYChartOptions,
  defaultFieldConfig as defaultXYChartFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';

import { VizPanelBuilder } from './VizPanelBuilder';

export const PanelBuilders = {
  barchart() {
    return new VizPanelBuilder<BarChartOptions, BarChartFieldConfig>(
      'barchart',
      '10.0.0',
      () => defaultBarChartOptions,
      () => defaultBarChartFieldConfig
    );
  },
  bargauge() {
    return new VizPanelBuilder<BarGaugeOptions, {}>('bargauge', '10.0.0', () => defaultBarGaugeOptions);
  },
  flamegraph() {
    return new VizPanelBuilder<{}, {}>('flamegraph', '10.0.0');
  },
  gauge() {
    return new VizPanelBuilder<GaugeOptions, {}>('gauge', '10.0.0', () => defaultGaugeOptions);
  },
  geomap() {
    return new VizPanelBuilder<GeomapOptions, {}>('geomap', '10.0.0', () => defaultGeomapOptions);
  },
  heatmap() {
    return new VizPanelBuilder<HeatmapOptions, HeatmapFieldConfig>('heatmap', '10.0.0', () => defaultHeatmapOptions);
  },
  histogram() {
    return new VizPanelBuilder<HistogramOptions, HistogramFieldConfig>(
      'histogram',
      '10.0.0',
      () => defaultHistogramOptions,
      () => defaultHistogramFieldConfig
    );
  },
  logs() {
    return new VizPanelBuilder<LogsOptions, {}>('logs', '10.0.0');
  },
  news() {
    return new VizPanelBuilder<NewsOptions, {}>('news', '10.0.0', () => defaultNewsOptions);
  },
  nodegraph() {
    return new VizPanelBuilder<NodeGraphOptions, {}>('nodeGraph', '10.0.0');
  },
  piechart() {
    return new VizPanelBuilder<PieChartOptions, PieChartFieldConfig>(
      'piechart',
      '10.0.0',
      () => defaultPieChartOptions
    );
  },
  stat() {
    return new VizPanelBuilder<StatOptions, {}>('stat', '10.0.0', () => defaultStatOptions);
  },
  statetimeline() {
    return new VizPanelBuilder<StateTimelineOptions, StateTimelineFieldConfig>(
      'state-timeline',
      '10.0.0',
      () => defaultStateTimelineOptions,
      () => defaultStateTimelineFieldConfig
    );
  },
  statushistory() {
    return new VizPanelBuilder<StatusHistoryOptions, StatusHistoryFieldConfig>(
      'status-history',
      '10.0.0',
      () => defaultStatusHistoryOptions,
      () => defaultStatusHistoryFieldConfig
    );
  },
  table() {
    return new VizPanelBuilder<TableOptions, TableFieldConfig>('table', '10.0.0', () => defaultTableOptions);
  },
  text() {
    return new VizPanelBuilder<TextOptions, {}>('text', '10.0.0', () => defaultTextOptions);
  },
  timeseries() {
    return new VizPanelBuilder<TimeSeriesOptions, TimeSeriesFieldConfig>('timeseries', '10.0.0');
  },
  trend() {
    return new VizPanelBuilder<{}, {}>('trend', '10.0.0');
  },
  traces() {
    return new VizPanelBuilder<TrendOptions, TrendFieldConfig>('traces', '10.0.0');
  },
  xychart() {
    return new VizPanelBuilder<XYChartOptions, {}>(
      'xychart',
      '10.0.0',
      () => defaultXYChartOptions,
      () => defaultXYChartFieldConfig
    );
  },
};

export { PanelOptionsBuilders } from './PanelOptionsBuilders';
export { FieldConfigBuilders } from './FieldConfigBuilders';
export { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder';
