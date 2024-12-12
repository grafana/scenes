import { defaultOptions } from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { defaultOptions as defaultOptions$1 } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import { defaultOptions as defaultOptions$2 } from '@grafana/schema/dist/esm/raw/composable/datagrid/panelcfg/x/DatagridPanelCfg_types.gen';
import { defaultOptions as defaultOptions$3 } from '@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen';
import { defaultOptions as defaultOptions$4 } from '@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeomapPanelCfg_types.gen';
import { defaultOptions as defaultOptions$5 } from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import { defaultOptions as defaultOptions$6 } from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { defaultOptions as defaultOptions$7 } from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { defaultOptions as defaultOptions$8 } from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import { defaultOptions as defaultOptions$9 } from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import { defaultOptions as defaultOptions$a } from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import { defaultOptions as defaultOptions$b } from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { defaultOptions as defaultOptions$c } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import { defaultOptions as defaultOptions$d } from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import { defaultOptions as defaultOptions$e } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';
import { PanelOptionsBuilder } from './PanelOptionsBuilder.js';

const PanelOptionsBuilders = {
  barchart() {
    return new PanelOptionsBuilder(() => defaultOptions);
  },
  bargauge() {
    return new PanelOptionsBuilder(() => defaultOptions$1);
  },
  datagrid() {
    return new PanelOptionsBuilder(() => defaultOptions$2);
  },
  flamegraph() {
    return new PanelOptionsBuilder();
  },
  gauge() {
    return new PanelOptionsBuilder(() => defaultOptions$3);
  },
  geomap() {
    return new PanelOptionsBuilder(() => defaultOptions$4);
  },
  heatmap() {
    return new PanelOptionsBuilder(() => defaultOptions$5);
  },
  histogram() {
    return new PanelOptionsBuilder(() => defaultOptions$6);
  },
  logs() {
    return new PanelOptionsBuilder();
  },
  news() {
    return new PanelOptionsBuilder(() => defaultOptions$7);
  },
  nodegraph() {
    return new PanelOptionsBuilder();
  },
  piechart() {
    return new PanelOptionsBuilder(() => defaultOptions$8);
  },
  stat() {
    return new PanelOptionsBuilder(() => defaultOptions$9);
  },
  statetimeline() {
    return new PanelOptionsBuilder(() => defaultOptions$a);
  },
  statushistory() {
    return new PanelOptionsBuilder(() => defaultOptions$b);
  },
  table() {
    return new PanelOptionsBuilder(() => defaultOptions$c);
  },
  text() {
    return new PanelOptionsBuilder(() => defaultOptions$d);
  },
  timeseries() {
    return new PanelOptionsBuilder();
  },
  trend() {
    return new PanelOptionsBuilder();
  },
  traces() {
    return new PanelOptionsBuilder();
  },
  xychart() {
    return new PanelOptionsBuilder(() => defaultOptions$e);
  }
};

export { PanelOptionsBuilders };
//# sourceMappingURL=PanelOptionsBuilders.js.map
