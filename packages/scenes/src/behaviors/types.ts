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

export type SceneQueryControllerEntryType = 'data' | 'annotations' | 'variable' | 'alerts' | 'plugin' | string;

export interface SceneInteractionProfileEvent {
  origin: string;
  duration: number;
  networkDuration: number;
  jsHeapSizeLimit: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  crumbs: string[];
  startTs: number;
  endTs: number;
  // add more granular data,i.e. network times? slow frames?
}

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
  enableProfiling?: boolean;
  onProfileComplete?(event: SceneInteractionProfileEvent): void;
}

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
  startProfile(name: string): void;
  cancelProfile(): void;
  runningQueriesCount(): number;
}

export interface InteractionProfileResult {
  interaction: string;
  interactionDuration: number;
  networkDuration: number;
  startTs: number;
  endTs: number;
}

export interface InteractionProfilerState extends SceneObjectState {
  onProfileComplete?: (result: InteractionProfileResult) => void;
  enableProfiling?: boolean;
}
