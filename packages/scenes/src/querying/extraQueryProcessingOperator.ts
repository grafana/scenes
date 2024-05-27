import { PanelData } from '@grafana/data';
import { map, Observable } from 'rxjs';
import { ExtraQueryProcessor } from './ExtraQueryProvider';

// Passthrough processor for use with ExtraQuerys.
export const passthroughProcessor: ExtraQueryProcessor = (_, secondary) => secondary;

// Factory function which takes a map from request ID to processor functions and
// returns an rxjs operator which operates on an array of panel data responses.
//
// Each secondary response is transformed according to the processor function
// identified by it's request ID. The processor function is passed the primary
// response and the secondary response to be processed.
//
// The output is a single frame with the primary series and all processed
// secondary series combined.
export const extraQueryProcessingOperator = (processors: Map<string, ExtraQueryProcessor>) =>
  (data: Observable<[PanelData, ...PanelData[]]>) => {
    return data.pipe(
      map(([primary, ...secondaries]) => {
        const frames = secondaries.flatMap((s) => {
          const processed = processors.get(s.request!.requestId)?.(primary, s) ?? s;
          return processed.series;
        });
        return {
          ...primary,
          series: [...primary.series, ...frames],
        };
      })
    );
  }
