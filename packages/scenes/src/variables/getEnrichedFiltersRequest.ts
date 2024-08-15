import { DataSourceGetTagKeysOptions, DataSourceGetTagValuesOptions } from '@grafana/data';
import { isFiltersRequestEnricher, SceneObject } from '../core/types';

export function getEnrichedFiltersRequest(
  sourceRunner: SceneObject
): Partial<DataSourceGetTagKeysOptions | DataSourceGetTagValuesOptions> | null {
  const root = sourceRunner.getRoot();

  if (isFiltersRequestEnricher(root)) {
    return root.enrichFiltersRequest(sourceRunner);
  }

  return null;
}
