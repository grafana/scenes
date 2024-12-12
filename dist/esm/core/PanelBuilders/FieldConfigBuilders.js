import { defaultFieldConfig } from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { defaultFieldConfig as defaultFieldConfig$1 } from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { defaultFieldConfig as defaultFieldConfig$2 } from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import { defaultFieldConfig as defaultFieldConfig$3 } from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { defaultFieldConfig as defaultFieldConfig$4 } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';
import { FieldConfigBuilder } from './FieldConfigBuilder.js';

const FieldConfigBuilders = {
  barchart() {
    return new FieldConfigBuilder(() => defaultFieldConfig);
  },
  bargauge() {
    return new FieldConfigBuilder();
  },
  datagrid() {
    return new FieldConfigBuilder();
  },
  flamegraph() {
    return new FieldConfigBuilder();
  },
  gauge() {
    return new FieldConfigBuilder();
  },
  geomap() {
    return new FieldConfigBuilder();
  },
  heatmap() {
    return new FieldConfigBuilder();
  },
  histogram() {
    return new FieldConfigBuilder(() => defaultFieldConfig$1);
  },
  logs() {
    return new FieldConfigBuilder();
  },
  news() {
    return new FieldConfigBuilder();
  },
  nodegraph() {
    return new FieldConfigBuilder();
  },
  piechart() {
    return new FieldConfigBuilder();
  },
  stat() {
    return new FieldConfigBuilder();
  },
  statetimeline() {
    return new FieldConfigBuilder(() => defaultFieldConfig$2);
  },
  statushistory() {
    return new FieldConfigBuilder(() => defaultFieldConfig$3);
  },
  table() {
    return new FieldConfigBuilder();
  },
  text() {
    return new FieldConfigBuilder();
  },
  timeseries() {
    return new FieldConfigBuilder();
  },
  trend() {
    return new FieldConfigBuilder();
  },
  traces() {
    return new FieldConfigBuilder();
  },
  xychart() {
    return new FieldConfigBuilder(() => defaultFieldConfig$4);
  }
};

export { FieldConfigBuilders };
//# sourceMappingURL=FieldConfigBuilders.js.map
