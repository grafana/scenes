import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneStatelessBehavior } from '../core/types';
import { SceneRenderProfiler } from './SceneRenderProfiler';
import { SceneInteractionTrackerState } from './types';

export function isInteractionTracker(s: SceneObject | SceneStatelessBehavior): s is SceneInteractionTracker {
  return 'isInteractionTracker' in s;
}

export class SceneInteractionTracker extends SceneObjectBase<SceneInteractionTrackerState> {
  public isInteractionTracker: true = true;

  public constructor(state: Partial<SceneInteractionTrackerState> = {}, private renderProfiler?: SceneRenderProfiler) {
    super(state);

    if (renderProfiler) {
      this.renderProfiler = renderProfiler;
      this.renderProfiler.setInteractionCompleteHandler(state.onInteractionComplete);
    }
  }

  public startInteraction(name: string) {
    if (!this.state.enableInteractionTracking) {
      return;
    }

    this.renderProfiler?.startInteraction(name);
  }

  public stopInteraction() {
    this.renderProfiler?.stopInteraction();
  }
}
