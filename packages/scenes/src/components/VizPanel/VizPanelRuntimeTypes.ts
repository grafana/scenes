import type { CustomTransformOperator, DataFrame, DataTransformerConfig } from '@grafana/data';
import type { SceneActivationHandler, SceneDataProvider, SceneStateChangedHandler } from '../../core/types';
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
  operator?: CustomTransformOperator;
}

interface RuntimeTransformationsPanelState {
  pluginId: string;
  $data?: SceneDataProvider;
  _UNSAFE_clearPreviousFieldValues?: boolean;
}

export interface RuntimeTransformationsPanel {
  readonly state: RuntimeTransformationsPanelState;

  addActivationHandler(handler: SceneActivationHandler): void;

  subscribeToState(handler: SceneStateChangedHandler<RuntimeTransformationsPanelState>): Unsubscribable;

  setState(update: Partial<RuntimeTransformationsPanelState>): void;
}
