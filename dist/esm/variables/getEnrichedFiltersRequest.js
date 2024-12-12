import { isFiltersRequestEnricher } from '../core/types.js';

function getEnrichedFiltersRequest(sourceRunner) {
  const root = sourceRunner.getRoot();
  if (isFiltersRequestEnricher(root)) {
    return root.enrichFiltersRequest(sourceRunner);
  }
  return null;
}

export { getEnrichedFiltersRequest };
//# sourceMappingURL=getEnrichedFiltersRequest.js.map
