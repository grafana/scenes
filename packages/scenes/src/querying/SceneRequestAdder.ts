import { DataQueryRequest, PanelData } from "@grafana/data";

import { SceneObjectBase } from "../core/SceneObjectBase";
import { SceneObjectState } from "../core/types";

// A transformation function called by the query runner with responses
// to any extra requests.
//
// See the docs for `extraRequestProcessingOperator` for more information.
export type TransformFunc = (primary: PanelData, secondary: PanelData) => PanelData;

// An extra request that should be run by a query runner, and an optional
// transform that should be called with the response data.
export interface ExtraRequest {
  // The request.
  req: DataQueryRequest;
  // An optional transformation function.
  transform?: TransformFunc;
}

// Indicates that this type wants to add extra requests to a query runner.
export interface SceneRequestAdder<T extends SceneObjectState> extends SceneObjectBase<T> {
  // Get any extra requests and their required transformations.
  getExtraRequests(request: DataQueryRequest): ExtraRequest[];
  // Determine whether a query should be rerun.
  shouldRerun(prev: T, next: T): boolean;
}

export function isRequestAdder(obj: any): obj is SceneRequestAdder<any> {
  return typeof obj === 'object' && 'getExtraRequests' in obj;
}
