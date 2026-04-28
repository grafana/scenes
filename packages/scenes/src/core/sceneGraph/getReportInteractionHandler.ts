import { SceneObject, SceneStatelessBehavior } from '../types';
import { getClosest } from './utils';

export interface AdHocFilterInteractionHandler {
  isAdHocFilterInteractionHandler: true;
  onFilterAdded?(payload: { key: string; operator: string }): void;
  onFilterRemoved?(payload: { key: string }): void;
  onFilterMatchAll?(payload: { key: string; origin?: string }): void;
  onFilterRestored?(payload: { key: string; origin?: string }): void;
  onGroupByAdded?(payload: { key: string }): void;
  onGroupByRemoved?(payload: { key: string; origin?: string }): void;
  onGroupByRestored?(): void;
  onClearAll?(payload: { filtersCleared: number; originsRestored: number }): void;
  onRecentFilterApplied?(payload: { key: string; operator: string }): void;
  onRecommendedFilterApplied?(payload: { key: string; operator: string }): void;
  onRecentGroupByApplied?(payload: { key: string }): void;
  onRecommendedGroupByApplied?(payload: { key: string }): void;
}

export function isAdHocFilterInteractionHandler(
  s: SceneObject | SceneStatelessBehavior
): s is SceneObject & AdHocFilterInteractionHandler {
  return 'isAdHocFilterInteractionHandler' in s;
}

export function getAdHocFilterInteractionHandler(sceneObject: SceneObject): AdHocFilterInteractionHandler | undefined {
  return getClosest(sceneObject, (s) => s.state.$behaviors?.find(isAdHocFilterInteractionHandler));
}
