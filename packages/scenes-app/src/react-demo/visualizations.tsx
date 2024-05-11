import { RVisualizationBuilders } from '@grafana/scenes';
import { FieldColorModeId, GraphDrawStyle, GraphGradientMode } from '@grafana/schema';

export const plainGraph = RVisualizationBuilders.timeseries().setCustomFieldConfig('fillOpacity', 6).build();

export const timeSeriesBars = RVisualizationBuilders.timeseries()
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 6)
  .build();

export const graphWithGrapdientColor = RVisualizationBuilders.timeseries()
  .setCustomFieldConfig('fillOpacity', 10)
  .setCustomFieldConfig('lineWidth', 3)
  .setCustomFieldConfig('gradientMode', GraphGradientMode.Scheme)
  .setColor({ mode: FieldColorModeId.ContinuousGrYlRd })
  .build();
