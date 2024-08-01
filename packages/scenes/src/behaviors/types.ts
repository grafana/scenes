import { LoadingState } from '@grafana/schema';
import { SceneObject, SceneObjectState } from '../core/types';
import { DataQueryRequest } from '@grafana/data';

export interface QueryResultWithState {
  state: LoadingState;
}

export interface SceneQueryControllerEntry {
  request?: DataQueryRequest;
  type: SceneQueryControllerEntryType;
  origin: SceneObject;
  cancel?: () => void;
}

export type SceneQueryControllerEntryType = 'data' | 'annotations' | 'variable' | 'alerts';

export interface SceneInteractionProfileEvent {
  origin: string;
  duration: number;
  crumbs: string[];
  // add more granular data,i.e. network times? slow frames?
}

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
  onProfileComplete?(event: SceneInteractionProfileEvent): void;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
  startProfile(source: SceneObject): void;
  runningQueriesCount(): number;
}
