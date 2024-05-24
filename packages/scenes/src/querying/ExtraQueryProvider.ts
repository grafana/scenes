import { DataQueryRequest, PanelData } from "@grafana/data";
import { Observable } from "rxjs";

import { SceneObjectBase } from "../core/SceneObjectBase";
import { SceneObjectState } from "../core/types";

// A processor function called by the query runner with responses
// to any extra requests.
//
// A processor function should accept two arguments: the data returned by the
// _primary_ query, and the data returned by the `ExtraQueryProvider`'s
// _secondary_ query. It should return a new `PanelData` representing the processed output.
// It should _not_ modify the primary PanelData.
//
// Examples of valid processing include alignment of data between primary and secondary
// (see the `timeShiftAlignmentProcessor` returned by `SceneTimeRangeCompare`), or doing
// some more advanced processing such as fitting a time series model on the secondary data.
//
// See the docs for `extraQueryProcessingOperator` for more information.
export type ExtraQueryDataProcessor = (primary: PanelData, secondary: PanelData) => Observable<PanelData>;

// An extra request that should be run by a query runner, and an optional
// processor that should be called with the response data.
export interface ExtraQueryDescriptor {
  // The extra request to add.
  req: DataQueryRequest;
  // An optional function used to process the data before passing it
  // to any transformations or visualizations.
  processor?: ExtraQueryDataProcessor;
}

// Whether extra queries, providers, or neither should be rerun as the result
// of a state change.
//
// Returning `true` or 'queries' will cause the query runner to completely rerun all queries
// _and_ processors.
// Returning 'processors' will avoid rerunning queries, and pass the most
// recent (unprocessed) query results to the processors again for reprocessing. This allows
// the processors to process differently depending on their most recent state, without incurring
// the cost of a query.
// Returning `false` will not rerun queries or processors.
export type ExtraQueryShouldRerun = boolean | 'queries' | 'processors';

// Indicates that this type wants to add extra requests, along with
// optional processing functions, to a query runner.
export interface ExtraQueryProvider<T extends SceneObjectState> extends SceneObjectBase<T> {
  // Get any extra requests and their required processors.
  getExtraQueries(request: DataQueryRequest): ExtraQueryDescriptor[];
  // Determine whether a query should be rerun.
  //
  // When the provider's state changes this function will be passed both the previous and the
  // next state. The implementation can use this to determine whether the change should trigger
  // a rerun of the queries, processors or neither.
  shouldRerun(prev: T, next: T): ExtraQueryShouldRerun;
}

export function isExtraQueryProvider(obj: any): obj is ExtraQueryProvider<any> {
  return typeof obj === 'object' && 'getExtraQueries' in obj;
}
