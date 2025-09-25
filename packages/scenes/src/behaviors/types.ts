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

// Long Frame Detection types (re-exported from LongFrameDetector)
export type { LongFrameEvent, LongFrameCallback } from './LongFrameDetector';

export interface SceneComponentInteractionEvent {
  origin: string;
  duration: number;
  networkDuration: number;
  startTs: number;
  endTs: number;
}

export interface SceneInteractionTrackerState extends SceneObjectState {
  enableInteractionTracking?: boolean;
  onInteractionComplete?(event: SceneComponentInteractionEvent): void;
}

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
  enableProfiling?: boolean;
  // onProfileComplete callback removed - replaced by observer pattern
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
