import { DataTopic, DataTransformerConfig } from '@grafana/data';
import { CustomTransformerDefinition } from '../../core/types';
import {
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
