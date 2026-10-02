import { isDataRequestFiltersEnricher, SceneObject } from '../core/types';
import { AdHocFilterWithLabels } from '../variables/adhoc/AdHocFiltersVariable';

export function getEnrichedDataRequestFilters(
  sourceRunner: SceneObject,
  filters: AdHocFilterWithLabels[]
): AdHocFilterWithLabels[] {
  const root = sourceRunner.getRoot();

  if (isDataRequestFiltersEnricher(root)) {
    return root.enrichDataRequestFilters(sourceRunner, filters);
  }

  return filters;
}
