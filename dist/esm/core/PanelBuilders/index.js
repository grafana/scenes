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
import { VizPanelBuilder } from './VizPanelBuilder.js';
import 'lodash';
import '@grafana/data';

const PanelBuilders = {
  barchart() {
    return new VizPanelBuilder(
      "barchart",
      "10.0.0",
      () => defaultOptions,
      () => defaultFieldConfig
    );
  },
  bargauge() {
    return new VizPanelBuilder("bargauge", "10.0.0", () => defaultOptions$1);
  },
  datagrid() {
    return new VizPanelBuilder("datagrid", "10.0.0", () => defaultOptions$2);
  },
  flamegraph() {
    return new VizPanelBuilder("flamegraph", "10.0.0");
  },
  gauge() {
    return new VizPanelBuilder("gauge", "10.0.0", () => defaultOptions$3);
  },
  geomap() {
    return new VizPanelBuilder("geomap", "10.0.0", () => defaultOptions$4);
  },
  heatmap() {
    return new VizPanelBuilder("heatmap", "10.0.0", () => defaultOptions$5);
  },
  histogram() {
    return new VizPanelBuilder(
      "histogram",
      "10.0.0",
      () => defaultOptions$6,
      () => defaultFieldConfig$1
    );
  },
  logs() {
    return new VizPanelBuilder("logs", "10.0.0");
  },
  news() {
    return new VizPanelBuilder("news", "10.0.0", () => defaultOptions$7);
  },
  nodegraph() {
    return new VizPanelBuilder("nodeGraph", "10.0.0");
  },
  piechart() {
    return new VizPanelBuilder(
      "piechart",
      "10.0.0",
      () => defaultOptions$8
    );
  },
  stat() {
    return new VizPanelBuilder("stat", "10.0.0", () => defaultOptions$9);
  },
  statetimeline() {
    return new VizPanelBuilder(
      "state-timeline",
      "10.0.0",
      () => defaultOptions$a,
      () => defaultFieldConfig$2
    );
  },
  statushistory() {
    return new VizPanelBuilder(
      "status-history",
      "10.0.0",
      () => defaultOptions$b,
      () => defaultFieldConfig$3
    );
  },
  table() {
    return new VizPanelBuilder("table", "10.0.0", () => defaultOptions$c);
  },
  text() {
    return new VizPanelBuilder("text", "10.0.0", () => defaultOptions$d);
  },
  timeseries() {
    return new VizPanelBuilder("timeseries", "10.0.0");
  },
  trend() {
    return new VizPanelBuilder("trend", "10.0.0");
  },
  traces() {
    return new VizPanelBuilder("traces", "10.0.0");
  },
  xychart() {
    return new VizPanelBuilder(
      "xychart",
      "10.0.0",
      () => defaultOptions$e,
      () => defaultFieldConfig$4
    );
  }
};

export { PanelBuilders };
//# sourceMappingURL=index.js.map
