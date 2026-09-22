import type { DataFrame, DataTransformerConfig } from '@grafana/data';
import type {
  CustomTransformerDefinition,
  SceneActivationHandler,
  SceneDataProvider,
  SceneStateChangedHandler,
} from '../../core/types';
import type { Unsubscribable } from 'rxjs';

export interface VizPanelRuntimeTransformations {
  /** Returns the same immutable snapshot until this owner changes. */
  get(owner: string): readonly DataTransformerConfig[];

  /** Replaces one owner's transformations. An empty list removes the owner. */
  set(owner: string, transformations: readonly DataTransformerConfig[]): void;

  /** Returns the frames entering this owner's transformation stage. */
  getSourceSeries(owner: string): readonly DataFrame[];

  /** Subscribes to changes for one owner. */
  subscribe(owner: string, callback: () => void): () => void;
}

export interface RuntimeTransformationGroup {
  transformations: readonly DataTransformerConfig[];
  sourceSeries: readonly DataFrame[];
  sourceData?: unknown;
  operators: CustomTransformerDefinition[];
}

interface RuntimeTransformationsPanelState {
  pluginId: string;
  $data?: SceneDataProvider;
}

export interface RuntimeTransformationsPanel {
  readonly state: RuntimeTransformationsPanelState;

  addActivationHandler(handler: SceneActivationHandler): void;

  subscribeToState(handler: SceneStateChangedHandler<RuntimeTransformationsPanelState>): Unsubscribable;
}
