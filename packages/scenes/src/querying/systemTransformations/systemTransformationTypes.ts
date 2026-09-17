import { CustomTransformOperator, DataFrame, DataTransformerConfig } from '@grafana/data';
import { CustomTransformerDefinition } from '../../core/types';

/**
 * Identifies the contributor that injected a system transformation.
 */
export type TransformationOrigin = string;

export type RuntimeTransformationPhase = 'beforeUser' | 'afterUser' | 'final';

export type RuntimeTransformation = DataTransformerConfig | CustomTransformerDefinition;

export interface RuntimeTransformationLayer {
  readonly id: string;
  readonly phase: RuntimeTransformationPhase;
  getTransformations(ctx: { series: DataFrame[] }): RuntimeTransformation[];
}

export interface RuntimeTransformationRegistration {
  changed(): void;
  dispose(): void;
}

export interface ResolvedRuntimeTransformationLayer {
  readonly id: string;
  readonly phase: RuntimeTransformationPhase;
  readonly origin: TransformationOrigin;
  readonly transformations: readonly RuntimeTransformation[];
}
/**
 * Whether a system transformation runs before or after the user configured transformations.
 */
export type SystemTransformationPosition = 'prepend' | 'append';
/**
 * A provider contributed transformation.
 */
export type SystemTransformation = (
  | DataTransformerConfig
  | Exclude<CustomTransformerDefinition, CustomTransformOperator>
) & {
  origin: TransformationOrigin;
  position: SystemTransformationPosition;
};

/**
 * Contributes transformations that wrap the user configured ones.
 * A SceneDataTransformer discovers on its parent when it activates (e.g. VizPanel).
 * Nothing a provider contributes ever reaches `state.transformations`.
 */
export interface SystemTransformationsProvider {
  readonly isSystemTransformationsProvider: true;
  readonly origin: TransformationOrigin;

  /**
   * Resolves what to run for the frames about to enter the pipeline. Called on every pass and does not write scene state.
   * Throwing is treated as noop rather than erroring.
   * What this returns is never interpolated. Only `state.transformations` is scanned for variable dependencies.
   */
  getSystemTransformations(ctx: { series: DataFrame[] }): {
    prepend?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    append?: Array<DataTransformerConfig | CustomTransformerDefinition>;
  };
}

/**
 * The system transformations in effect for a given set of source frames, in pipeline order.
 */
export interface ResolvedSystemTransformations {
  prepend: SystemTransformation[];
  append: SystemTransformation[];
}
