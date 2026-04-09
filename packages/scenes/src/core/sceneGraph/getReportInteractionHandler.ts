import { SceneObject, SceneStatelessBehavior } from '../types';
import { getClosest } from './utils';

export interface ReportInteractionBehaviorLike {
  isReportInteractionBehavior: true;
  reportInteraction(interactionName: string, properties?: Record<string, unknown>): void;
}

export function isReportInteractionBehavior(
  s: SceneObject | SceneStatelessBehavior
): s is SceneObject & ReportInteractionBehaviorLike {
  return 'isReportInteractionBehavior' in s;
}

export function getReportInteractionHandler(sceneObject: SceneObject): ReportInteractionBehaviorLike | undefined {
  return getClosest(sceneObject, (s) => s.state.$behaviors?.find(isReportInteractionBehavior));
}
