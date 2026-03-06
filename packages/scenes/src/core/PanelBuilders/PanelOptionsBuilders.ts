import {
  Options as BarChartOptions,
  defaultOptions as defaultBarChartOptions,
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
  defaultOptions as defaultHeatmapOptions,
} from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import {
  Options as HistogramOptions,
  defaultOptions as defaultHistogramOptions,
} from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { Options as LogsOptions } from '@grafana/schema/dist/esm/raw/composable/logs/panelcfg/x/LogsPanelCfg_types.gen';
import {
  Options as NewsOptions,
  defaultOptions as defaultNewsOptions,
} from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { Options as NodeGraphOptions } from '@grafana/schema/dist/esm/raw/composable/nodegraph/panelcfg/x/NodeGraphPanelCfg_types.gen';
import {
  Options as PieChartOptions,
  defaultOptions as defaultPieChartOptions,
} from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import {
  Options as StatOptions,
  defaultOptions as defaultStatOptions,
} from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import {
  Options as StateTimelineOptions,
  defaultOptions as defaultStateTimelineOptions,
} from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import {
  Options as StatusHistoryOptions,
  defaultOptions as defaultStatusHistoryOptions,
} from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import {
  Options as TableOptions,
  defaultOptions as defaultTableOptions,
} from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import {
  Options as TextOptions,
  defaultOptions as defaultTextOptions,
} from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import { Options as TimeSeriesOptions } from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import { Options as TrendOptions } from '@grafana/schema/dist/esm/raw/composable/trend/panelcfg/x/TrendPanelCfg_types.gen';
import {
  Options as XYChartOptions,
  defaultOptions as defaultXYChartOptions,
} from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';

import { PanelOptionsBuilder } from './PanelOptionsBuilder';

export const PanelOptionsBuilders = {
  barchart() {
    return new PanelOptionsBuilder<BarChartOptions>(() => defaultBarChartOptions);
  },
  bargauge() {
    return new PanelOptionsBuilder<BarGaugeOptions>(() => defaultBarGaugeOptions);
  },
  flamegraph() {
    return new PanelOptionsBuilder<{}>();
  },
  gauge() {
    return new PanelOptionsBuilder<GaugeOptions>(() => defaultGaugeOptions);
  },
  geomap() {
    return new PanelOptionsBuilder<GeomapOptions>(() => defaultGeomapOptions);
  },
  heatmap() {
    return new PanelOptionsBuilder<HeatmapOptions>(() => defaultHeatmapOptions);
  },
  histogram() {
    return new PanelOptionsBuilder<HistogramOptions>(() => defaultHistogramOptions);
  },
  logs() {
    return new PanelOptionsBuilder<LogsOptions>();
  },
  news() {
    return new PanelOptionsBuilder<NewsOptions>(() => defaultNewsOptions);
  },
  nodegraph() {
    return new PanelOptionsBuilder<NodeGraphOptions>();
  },
  piechart() {
    return new PanelOptionsBuilder<PieChartOptions>(() => defaultPieChartOptions);
  },
  stat() {
    return new PanelOptionsBuilder<StatOptions>(() => defaultStatOptions);
  },
  statetimeline() {
    return new PanelOptionsBuilder<StateTimelineOptions>(() => defaultStateTimelineOptions);
  },
  statushistory() {
    return new PanelOptionsBuilder<StatusHistoryOptions>(() => defaultStatusHistoryOptions);
  },
  table() {
    return new PanelOptionsBuilder<TableOptions>(() => defaultTableOptions);
  },
  text() {
    return new PanelOptionsBuilder<TextOptions>(() => defaultTextOptions);
  },
  timeseries() {
    return new PanelOptionsBuilder<TimeSeriesOptions>();
  },
  trend() {
    return new PanelOptionsBuilder<{}>();
  },
  traces() {
    return new PanelOptionsBuilder<TrendOptions>();
  },
  xychart() {
    return new PanelOptionsBuilder<XYChartOptions>(() => defaultXYChartOptions);
  },
};
