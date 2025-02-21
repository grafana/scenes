import { PanelData } from '@grafana/data';
import { forkJoin, of, map, mergeMap, Observable } from 'rxjs';
import { ExtraQueryDataProcessor } from './ExtraQueryProvider';

// Passthrough processor for use with ExtraQuerys.
export const passthroughProcessor: ExtraQueryDataProcessor = (_, secondary) => of(secondary);

// Factory function which takes a map from request ID to processor functions and
// returns an rxjs operator which operates on an array of panel data responses.
//
// Each secondary response is transformed according to the processor function
// identified by it's request ID. The processor function is passed the primary
// response and the secondary response to be processed.
//
// The output is a single frame with the primary series and all processed
// secondary series combined.
export const extraQueryProcessingOperator =
  (processors: Map<string, ExtraQueryDataProcessor>) => (data: Observable<[PanelData, ...PanelData[]]>) => {
    return data.pipe(
      mergeMap(([primary, ...secondaries]) => {
        const processedSecondaries = secondaries.flatMap((s) => {
          return processors.get(s.request!.requestId)?.(primary, s) ?? of(s);
        });
        return forkJoin([of(primary), ...processedSecondaries]);
      }),
      map(([primary, ...processedSecondaries]) => ({
        ...primary,
        series: [...primary.series, ...processedSecondaries.flatMap((s) => s.series)],
        annotations: [...(primary.annotations ?? []), ...processedSecondaries.flatMap((s) => s.annotations ?? [])],
      }))
    );
  };
