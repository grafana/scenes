import { PanelData } from "@grafana/data";

import { SceneObjectBase } from "../core/SceneObjectBase";
import { SceneObjectState } from "../core/types";

export interface SceneQueryProcessor<T extends SceneObjectState> extends SceneObjectBase<T> {
  processQueryResults(data: PanelData): PanelData;
  // Determine whether a query and processor should be rerun.
  shouldRerun(prev: T, next: T): { processor: boolean; query: boolean; };
}

export function isQueryProcessor(obj: any): obj is SceneQueryProcessor<any> {
  return typeof obj === 'object' && 'processQueryResults' in obj;
}
