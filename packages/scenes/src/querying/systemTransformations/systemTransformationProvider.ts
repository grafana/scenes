import { DataTopic, DataTransformerConfig } from '@grafana/data';
import { CustomTransformerDefinition } from '../../core/types';
import {
  ResolvedRuntimeTransformationLayer,
  ResolvedSystemTransformations,
  RuntimeTransformation,
  RuntimeTransformationPhase,
  SystemTransformation,
  SystemTransformationPosition,
  SystemTransformationsProvider,
  TransformationOrigin,
} from './systemTransformationTypes';

const PROVIDER_PREPEND_LAYER_ID = '$system-prepend';
const PROVIDER_APPEND_LAYER_ID = '$system-append';

/**
 * Narrows SystemTransformationsProvider
 */
export function isSystemTransformationsProvider(o: unknown): o is SystemTransformationsProvider {
  return typeof o === 'object' && o !== null && 'isSystemTransformationsProvider' in o;
}

/**
 * @internal
 */
export function toSystemTransformation(
  transformation: DataTransformerConfig | CustomTransformerDefinition,
  position: SystemTransformationPosition,
  origin: TransformationOrigin
): SystemTransformation {
  if (typeof transformation === 'function') {
    return { operator: transformation, topic: DataTopic.Series, origin, position };
  }

  return { ...transformation, origin, position };
}

/**
 * getResolvedSystemTransformations hands the same object to the pipeline and to every editor reading what
 * is running, and the two above are module singletons shared by every transformer. Freezing makes a caller
 * that mutates one fail at the mutation rather than corrupting readers it never knew about.
 */
export function freezeResolved(resolved: ResolvedSystemTransformations): ResolvedSystemTransformations {
  Object.freeze(resolved.prepend);
  Object.freeze(resolved.append);

  return Object.freeze(resolved);
}

export function freezeResolvedRuntimeLayer(
  id: string,
  phase: RuntimeTransformationPhase,
  origin: TransformationOrigin,
  transformations: readonly RuntimeTransformation[]
): ResolvedRuntimeTransformationLayer {
  const frozenTransformations = Object.freeze([...transformations]);

  return Object.freeze({ id, phase, origin, transformations: frozenTransformations });
}

export function freezeResolvedRuntimeLayers(
  layers: readonly ResolvedRuntimeTransformationLayer[]
): readonly ResolvedRuntimeTransformationLayer[] {
  return Object.freeze(layers);
}

export function systemTransformationsToRuntimeLayers(
  resolved: ResolvedSystemTransformations,
  origin: TransformationOrigin
): ResolvedRuntimeTransformationLayer[] {
  const layers: ResolvedRuntimeTransformationLayer[] = [];

  if (resolved.prepend.length > 0) {
    layers.push(freezeResolvedRuntimeLayer(PROVIDER_PREPEND_LAYER_ID, 'beforeUser', origin, resolved.prepend));
  }

  if (resolved.append.length > 0) {
    layers.push(freezeResolvedRuntimeLayer(PROVIDER_APPEND_LAYER_ID, 'afterUser', origin, resolved.append));
  }

  return layers;
}
