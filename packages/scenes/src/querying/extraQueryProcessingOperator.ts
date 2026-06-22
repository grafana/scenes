import { LoadingState, PanelData } from '@grafana/data';
import { combineLatest, map, mergeMap, Observable, of, tap } from 'rxjs';
import { ExtraQueryDataProcessor } from './ExtraQueryProvider';

// Passthrough processor for use with ExtraQuerys.
export const passthroughProcessor: ExtraQueryDataProcessor = (_, secondary) => of(secondary);

/**
 * Combines loading responseState across multiple responses
 * If any response contains an error => Error
 * Otherwise, if any response is loading => Loading
 * Otherwise, if any response is streaming => Streaming
 * otherwise return the first/primary response state
 * @param responseState
 */
function combineLoadingStates(responseState: LoadingState[]): LoadingState {
  if (responseState.some((s) => s === LoadingState.Error)) {
    return LoadingState.Error;
  }
  if (responseState.some((s) => s === LoadingState.Loading)) {
    return LoadingState.Loading;
  }
  if (responseState.some((s) => s === LoadingState.Streaming)) {
    return LoadingState.Streaming;
  }
  // If nothing is Error, Loading, or Streaming, return the LoadingState of the primary (zero index) response.
  return responseState[0] ?? LoadingState.Done;
}

/**
 * extraQueryProcessingOperator maps requests by requestId to processor functions and returns an rxjs operator which operates on an array of panel data responses.
 *
 * Each secondary response is transformed according to the processor function identified by its request ID.
 * The processor function is passed both the primary and the secondary responses.
 * The output PanelData combines the primary and secondary series, and loading state & errors are aggregated across all
 * responses so that intermediate states are reflected while requests are in flight.
 * @param panelDataProcessors
 */
type RequestId = string;
export const extraQueryProcessingOperator =
  (panelDataProcessors: Map<RequestId, ExtraQueryDataProcessor>) => (data: Observable<[PanelData, ...PanelData[]]>) => {
    // combineLatest re-emits whenever any source updates, so the same secondary response object can be seen multiple times.
    // Processors may mutate their input and are not guaranteed to be idempotent, so we cache the processed output by source identity and only run each processor once per secondary response.
    const processedCache = new WeakMap<PanelData, PanelData>();
    return data.pipe(
      mergeMap(([primaryResponse, ...secondaryResponses]) => {
        const processedSecondaries = secondaryResponses.map((s) => {
          const cached = processedCache.get(s);
          if (cached) {
            return of(cached);
          }
          const processedPanelData = panelDataProcessors.get(s.request!.requestId)?.(primaryResponse, s) ?? of(s);
          return processedPanelData.pipe(tap((out) => processedCache.set(s, out)));
        });
        return combineLatest([of(primaryResponse), ...processedSecondaries]);
      }),
      map(([processedPrimary, ...processedSecondaries]) => {
        const allResponses = [processedPrimary, ...processedSecondaries];
        const allResponseErrors = allResponses.flatMap((d) => d.errors ?? []);
        return {
          ...processedPrimary,
          state: combineLoadingStates(allResponses.map((d) => d.state)),
          series: [...processedPrimary.series, ...processedSecondaries.flatMap((s) => s.series)],
          annotations: [
            ...(processedPrimary.annotations ?? []),
            ...processedSecondaries.flatMap((s) => s.annotations ?? []),
          ],
          ...(allResponseErrors.length > 0 ? { errors: allResponseErrors, error: allResponseErrors[0] } : {}),
        };
      })
    );
  };
