import { DataQueryRequest, PanelData } from "@grafana/data";

import { SceneObjectBase } from "../core/SceneObjectBase";
import { SceneObjectState } from "../core/types";

// A processor function called by the query runner with responses
// to any extra requests.
//
// See the docs for `extraRequestProcessingOperator` for more information.
export type ProcessorFunc = (primary: PanelData, secondary: PanelData) => PanelData;

// An extra request that should be run by a query runner, and an optional
// processor that should be called with the response data.
export interface ExtraRequest {
  // The request.
  req: DataQueryRequest;
  // An optional function used to process the data before passing it
  // to any transformations or visualizations.
  processor?: ProcessorFunc;
}

// Indicates that this type wants to add extra requests to a query runner.
export interface SceneRequestSupplementer<T extends SceneObjectState> extends SceneObjectBase<T> {
  // Get any supplemental requests.
  getSupplementalRequests(request: DataQueryRequest): ExtraRequest[];
  // Determine whether a query should be rerun.
  shouldRerun(prev: T, next: T): { processor: boolean; query: boolean; };
}

export function isRequestAdder(obj: any): obj is SceneRequestSupplementer<any> {
  return typeof obj === 'object' && 'getSupplementalRequests' in obj;
}
