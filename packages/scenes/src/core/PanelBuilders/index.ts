import { TableFieldOptions as TableFieldConfig } from '@grafana/schema';

import {
  Options as BarChartOptions,
  FieldConfig as BarChartFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { Options as BarGaugeOptions } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import { Options as DataGridOptions } from '@grafana/schema/dist/esm/raw/composable/datagrid/panelcfg/x/DataGridPanelCfg_types.gen';
import { Options as GaugeOptions } from '@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen';
import { Options as GeomapOptions } from '@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeoMapPanelCfg_types.gen';
import {
  Options as HeatmapOptions,
  FieldConfig as HeatmapFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import {
  Options as HistogramOptions,
  FieldConfig as HistogramFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { Options as LogsOptions } from '@grafana/schema/dist/esm/raw/composable/logs/panelcfg/x/LogsPanelCfg_types.gen';
import { Options as NewsOptions } from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { Options as NodeGraphOptions } from '@grafana/schema/dist/esm/raw/composable/nodegraph/panelcfg/x/NodeGraphPanelCfg_types.gen';
import {
  Options as PieChartOptions,
  FieldConfig as PieChartFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import { Options as StatOptions } from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import {
  Options as StateTimelineOptions,
  FieldConfig as StateTimelineFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import {
  Options as StatusHistoryOptions,
  FieldConfig as StatusHistoryFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { Options as TableOptions } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import { Options as TextOptions } from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import {
  Options as TimeSeriesOptions,
  FieldConfig as TimeSeriesFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import {
  Options as TrendOptions,
  FieldConfig as TrendFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/trend/panelcfg/x/TrendPanelCfg_types.gen';
import { Options as XYChartOptions } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';

import { VizPanelBuilder } from './VizPanelBuilder';

export const PanelBuilders = {
  barchart() {
    return new VizPanelBuilder<BarChartOptions, BarChartFieldConfig>('barchart', '1.0.0');
  },
  bargauge() {
    return new VizPanelBuilder<BarGaugeOptions, {}>('bargauge', '1.0.0');
  },
  datagrid() {
    return new VizPanelBuilder<DataGridOptions, {}>('datagrid', '1.0.0');
  },
  gauge() {
    return new VizPanelBuilder<GaugeOptions, {}>('gauge', '1.0.0');
  },
  geomap() {
    return new VizPanelBuilder<GeomapOptions, {}>('geomap', '1.0.0');
  },
  heatmap() {
    return new VizPanelBuilder<HeatmapOptions, HeatmapFieldConfig>('heatmap', '1.0.0');
  },
  histogram() {
    return new VizPanelBuilder<HistogramOptions, HistogramFieldConfig>('histogram', '1.0.0');
  },
  logs() {
    return new VizPanelBuilder<LogsOptions, {}>('logs', '1.0.0');
  },
  news() {
    return new VizPanelBuilder<NewsOptions, {}>('news', '1.0.0');
  },
  nodegraph() {
    return new VizPanelBuilder<NodeGraphOptions, {}>('nodeGraph', '1.0.0');
  },
  piechart() {
    return new VizPanelBuilder<PieChartOptions, PieChartFieldConfig>('piechart', '1.0.0');
  },
  stat() {
    return new VizPanelBuilder<StatOptions, {}>('state', '1.0.0');
  },
  statetimeline() {
    return new VizPanelBuilder<StateTimelineOptions, StateTimelineFieldConfig>('state-timeline', '1.0.0');
  },
  statushistory() {
    return new VizPanelBuilder<StatusHistoryOptions, StatusHistoryFieldConfig>('status-history', '1.0.0');
  },
  table() {
    return new VizPanelBuilder<TableOptions, TableFieldConfig>('table', '1.0.0');
  },
  text() {
    return new VizPanelBuilder<TextOptions, {}>('text', '1.0.0');
  },
  timeseries() {
    return new VizPanelBuilder<TimeSeriesOptions, TimeSeriesFieldConfig>('timeseries', '1.0.0');
  },
  trend() {
    return new VizPanelBuilder<{}, {}>('trend', '1.0.0');
  },
  traces() {
    return new VizPanelBuilder<TrendOptions, TrendFieldConfig>('traces', '1.0.0');
  },
  xychart() {
    return new VizPanelBuilder<XYChartOptions, {}>('xychart', '1.0.0');
  },
};
