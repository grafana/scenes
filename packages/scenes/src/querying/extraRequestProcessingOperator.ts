import { PanelData } from '@grafana/data';
import { map, Observable } from 'rxjs';
import { TransformFunc } from './SceneRequestAdder';

// Passthrough transformation for use with ExtraRequests.
export const passthroughTransform: TransformFunc = (_, secondary) => secondary;

// Factory function which takes a map from request ID to transform functions and
// returns an rxjs operator which operates on an array of panel data responses.
// The responses must have length at least 2; the first is treated as the 'primary'
// response and the rest as secondary responses.
//
// Each secondary response is transformed according to the transform function
// identified by it's request ID. The transform function is passed the primary
// response and the secondary response to be processed.
//
// The output is a single frame with the primary series and all transformed
// secondary series combined.
export const extraRequestProcessingOperator = (transforms: Map<string, TransformFunc>) =>
  (data: Observable<[PanelData, PanelData, ...PanelData[]]>) => {
    return data.pipe(
      map(([primary, ...secondaries]) => {
        const frames = secondaries.flatMap((s) => {
          const transformed = transforms.get(s.request!.requestId)?.(primary, s) ?? s;
          return transformed.series;
        });
        return {
          ...primary,
          series: [...primary.series, ...frames],
        };
      })
    );
  }
