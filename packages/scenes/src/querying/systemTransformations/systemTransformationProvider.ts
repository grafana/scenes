import { DataTopic, DataTransformerConfig } from '@grafana/data';
import { CustomTransformerDefinition } from '../../core/types';
import {
  ResolvedSystemTransformations,
  SystemTransformation,
  SystemTransformationPosition,
  SystemTransformationsProvider,
  TransformationOrigin,
} from './systemTransformationTypes';

/**
 * Narrows SystemTransformationsProvider
 */
export function isSystemTransformationsProvider(o: unknown): o is SystemTransformationsProvider {
  return (
    typeof o === 'object' &&
    o !== null &&
    'origin' in o &&
    typeof (o as SystemTransformationsProvider).getSystemTransformations === 'function'
  );
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
