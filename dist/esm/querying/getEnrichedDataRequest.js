import { isDataRequestEnricher } from '../core/types.js';

function getEnrichedDataRequest(sourceRunner) {
  const root = sourceRunner.getRoot();
  if (isDataRequestEnricher(root)) {
    return root.enrichDataRequest(sourceRunner);
  }
  return null;
}

export { getEnrichedDataRequest };
//# sourceMappingURL=getEnrichedDataRequest.js.map
