/**
 * Performance tracking callback types
 */

export type QueryCompletionCallback = (endTimestamp: number, error?: any) => void;
export type PluginLoadCompletionCallback = (plugin: any, fromCache?: boolean) => void;
export type FieldConfigCompletionCallback = (
  endTimestamp: number,
  dataPointsCount?: number,
  seriesCount?: number
) => void;
export type RenderCompletionCallback = (endTimestamp: number, duration: number) => void;
export type DataTransformCompletionCallback = (
  endTimestamp: number,
  duration: number,
  success: boolean,
  result?: {
    error?: string;
  }
) => void;
