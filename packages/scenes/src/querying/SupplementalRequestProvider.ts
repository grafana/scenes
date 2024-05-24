import { DataQueryRequest, PanelData } from "@grafana/data";

import { SceneObjectBase } from "../core/SceneObjectBase";
import { SceneObjectState } from "../core/types";

// A processor function called by the query runner with responses
// to any extra requests.
//
// A processor function should accept two arguments: the data returned by the
// _primary_ query, and the data returned by the `SupplementalRequestProvider`'s
// _secondary_ query. It should return a new `PanelData` representing the processed output.
// It should _not_ modify the primary PanelData.
//
// Examples of valid processing include alignment of data between primary and secondary
// (see the `timeShiftAlignmentProcessor` returned by `SceneTimeRangeCompare`), or doing
// some more advanced processing such as fitting a time series model on the secondary data.
//
// See the docs for `extraRequestProcessingOperator` for more information.
export type ProcessorFunc = (primary: PanelData, secondary: PanelData) => PanelData;

// An extra request that should be run by a query runner, and an optional
// processor that should be called with the response data.
export interface SupplementalRequest {
  // The extra request to add.
  req: DataQueryRequest;
  // An optional function used to process the data before passing it
  // to any transformations or visualizations.
  processor?: ProcessorFunc;
}

// Indicates that this type wants to add supplemental requests, along with
// optional processing functions, to a query runner.
export interface SupplementalRequestProvider<T extends SceneObjectState> extends SceneObjectBase<T> {
  // Get any supplemental requests and their required processors.
  getSupplementalRequests(request: DataQueryRequest): SupplementalRequest[];
  // Determine whether a query should be rerun.
  //
  // When the provider's state changes this function will be passed both the previous and the
  // next state. The implementation can use this to determine whether the change should trigger
  // a rerun of the query or not.
  shouldRerun(prev: T, next: T): boolean;
}

export function isSupplementalRequestProvider(obj: any): obj is SupplementalRequestProvider<any> {
  return typeof obj === 'object' && 'getSupplementalRequests' in obj;
}
