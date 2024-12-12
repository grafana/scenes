import { defaultOptions, defaultFieldConfig } from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { defaultOptions as defaultOptions$1 } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import { defaultOptions as defaultOptions$2 } from '@grafana/schema/dist/esm/raw/composable/datagrid/panelcfg/x/DatagridPanelCfg_types.gen';
import { defaultOptions as defaultOptions$3 } from '@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen';
import { defaultOptions as defaultOptions$4 } from '@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeomapPanelCfg_types.gen';
import { defaultOptions as defaultOptions$5 } from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import { defaultOptions as defaultOptions$6, defaultFieldConfig as defaultFieldConfig$1 } from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { defaultOptions as defaultOptions$7 } from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { defaultOptions as defaultOptions$8 } from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import { defaultOptions as defaultOptions$9 } from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import { defaultOptions as defaultOptions$a, defaultFieldConfig as defaultFieldConfig$2 } from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import { defaultOptions as defaultOptions$b, defaultFieldConfig as defaultFieldConfig$3 } from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { defaultOptions as defaultOptions$c } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import { defaultOptions as defaultOptions$d } from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import { defaultOptions as defaultOptions$e, defaultFieldConfig as defaultFieldConfig$4 } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';
import { VizConfigBuilder } from './VizConfigBuilder.js';

const VizConfigBuilders = {
  barchart() {
    return new VizConfigBuilder(
      "barchart",
      "10.0.0",
      () => defaultOptions,
      () => defaultFieldConfig
    );
  },
  bargauge() {
    return new VizConfigBuilder("bargauge", "10.0.0", () => defaultOptions$1);
  },
  datagrid() {
    return new VizConfigBuilder("datagrid", "10.0.0", () => defaultOptions$2);
  },
  flamegraph() {
    return new VizConfigBuilder("flamegraph", "10.0.0");
  },
  gauge() {
    return new VizConfigBuilder("gauge", "10.0.0", () => defaultOptions$3);
  },
  geomap() {
    return new VizConfigBuilder("geomap", "10.0.0", () => defaultOptions$4);
  },
  heatmap() {
    return new VizConfigBuilder("heatmap", "10.0.0", () => defaultOptions$5);
  },
  histogram() {
    return new VizConfigBuilder(
      "histogram",
      "10.0.0",
      () => defaultOptions$6,
      () => defaultFieldConfig$1
    );
  },
  logs() {
    return new VizConfigBuilder("logs", "10.0.0");
  },
  news() {
    return new VizConfigBuilder("news", "10.0.0", () => defaultOptions$7);
  },
  nodegraph() {
    return new VizConfigBuilder("nodeGraph", "10.0.0");
  },
  piechart() {
    return new VizConfigBuilder(
      "piechart",
      "10.0.0",
      () => defaultOptions$8
    );
  },
  stat() {
    return new VizConfigBuilder("stat", "10.0.0", () => defaultOptions$9);
  },
  statetimeline() {
    return new VizConfigBuilder(
      "state-timeline",
      "10.0.0",
      () => defaultOptions$a,
      () => defaultFieldConfig$2
    );
  },
  statushistory() {
    return new VizConfigBuilder(
      "status-history",
      "10.0.0",
      () => defaultOptions$b,
      () => defaultFieldConfig$3
    );
  },
  table() {
    return new VizConfigBuilder("table", "10.0.0", () => defaultOptions$c);
  },
  text() {
    return new VizConfigBuilder("text", "10.0.0", () => defaultOptions$d);
  },
  timeseries() {
    return new VizConfigBuilder("timeseries", "10.0.0");
  },
  trend() {
    return new VizConfigBuilder("trend", "10.0.0");
  },
  traces() {
    return new VizConfigBuilder("traces", "10.0.0");
  },
  xychart() {
    return new VizConfigBuilder(
      "xychart",
      "10.0.0",
      () => defaultOptions$e,
      () => defaultFieldConfig$4
    );
  }
};

export { VizConfigBuilders };
//# sourceMappingURL=VizConfigBuilders.js.map
