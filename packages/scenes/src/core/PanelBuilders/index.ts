import { TableFieldOptions as TableFieldConfig } from '@grafana/schema';
import {
  Options as TimeSeriesOptions,
  FieldConfig as TimeSeriesFieldConfig,
} from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import { Options as TableOptions } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import { Options as BarGaugeOptions } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import { VizPanelBuilder } from './VizPanelBuilder';

export const PanelBuilders = {
  timeseries() {
    return new VizPanelBuilder<TimeSeriesOptions, TimeSeriesFieldConfig>('timeseries', '1.0.0');
  },
  table() {
    return new VizPanelBuilder<TableOptions, TableFieldConfig>('table', '1.0.0');
  },
  bargauge() {
    return new VizPanelBuilder<BarGaugeOptions, {}>('bargauge', '1.0.0');
  },
};
