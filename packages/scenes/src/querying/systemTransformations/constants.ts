import { DataFrame } from '@grafana/data';

import { ResolvedRuntimeTransformationLayer, ResolvedSystemTransformations } from './systemTransformationTypes';
import { freezeResolved, freezeResolvedRuntimeLayers } from './systemTransformationProvider';

/**
 * Stands in for the source frames before the first query result. A fresh [] each time would miss memo and re-resolve.
 */
export const NO_SERIES: DataFrame[] = [];

/** Shared for the same reason: a transformer with no provider hands the same object to every caller. */
export const NO_SYSTEM_TRANSFORMATIONS: ResolvedSystemTransformations = { prepend: [], append: [] };
export const NO_RUNTIME_TRANSFORMATION_LAYERS: readonly ResolvedRuntimeTransformationLayer[] = [];

freezeResolved(NO_SYSTEM_TRANSFORMATIONS);
freezeResolvedRuntimeLayers(NO_RUNTIME_TRANSFORMATION_LAYERS);
Object.freeze(NO_SERIES);
