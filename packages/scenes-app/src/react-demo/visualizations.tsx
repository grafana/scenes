import { VizConfigBuilders } from '@grafana/scenes';
import { FieldColorModeId, GraphDrawStyle, GraphGradientMode } from '@grafana/schema';

export const plainGraph = VizConfigBuilders.timeseries().setCustomFieldConfig('fillOpacity', 6).build();

export const timeSeriesBars = VizConfigBuilders.timeseries()
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 6)
  .build();

export const graphWithGrapdientColor = VizConfigBuilders.timeseries()
  .setCustomFieldConfig('fillOpacity', 10)
  .setCustomFieldConfig('lineWidth', 3)
  .setCustomFieldConfig('gradientMode', GraphGradientMode.Scheme)
  .setColor({ mode: FieldColorModeId.ContinuousGrYlRd })
  .build();
