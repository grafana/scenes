import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneStatelessBehavior } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneRenderProfiler } from '../performance/SceneRenderProfiler';
import { SceneQueryControllerEntry, SceneQueryControllerLike, SceneQueryStateControllerState } from './types';

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

export class SceneQueryController
  extends SceneObjectBase<SceneQueryStateControllerState>
  implements SceneQueryControllerLike
{
  public isQueryController: true = true;

  #running = new Set<SceneQueryControllerEntry>();

  #tryCompleteProfileFrameId: number | null = null;

  public constructor(state: Partial<SceneQueryStateControllerState> = {}, private profiler?: SceneRenderProfiler) {
    super({ ...state, isRunning: false });

    if (profiler) {
      this.profiler = profiler;
      profiler.setQueryController(this);
    }

    // Clear running state on deactivate
    this.addActivationHandler(() => {
      // In cases of re-activation, we need to set the query controller again as it might have been set by other scene
      this.profiler?.setQueryController(this);
      return () => this.#running.clear();
    });
  }

  public runningQueriesCount = () => {
    return this.#running.size;
  };

  public startProfile(name: string) {
    if (!this.state.enableProfiling) {
      return;
    }
    this.profiler?.startProfile(name);
  }

  public cancelProfile() {
    this.profiler?.cancelProfile();
  }

  public queryStarted(entry: SceneQueryControllerEntry) {
    this.#running.add(entry);
    this.changeRunningQueryCount(1, entry);

    if (!this.state.isRunning) {
      this.setState({ isRunning: true });
    }
  }

  public queryCompleted(entry: SceneQueryControllerEntry) {
    if (!this.#running.has(entry)) {
      return;
    }

    this.#running.delete(entry);

    this.changeRunningQueryCount(-1);

    if (this.#running.size === 0) {
      this.setState({ isRunning: false });
    }
  }

  private changeRunningQueryCount(dir: 1 | -1, entry?: SceneQueryControllerEntry) {
    /**
     * Used by grafana-image-renderer to know when all queries are completed.
     */
    (window as any).__grafanaRunningQueryCount = ((window as any).__grafanaRunningQueryCount ?? 0) + dir;

    if (dir === 1 && this.state.enableProfiling) {
      if (entry) {
        // Collect profile crumbs, variables, annotations, queries and plugins
        this.profiler?.addCrumb(`${entry.type}`);
      }
      if (this.profiler?.isTailRecording()) {
        writeSceneLog('SceneQueryController', 'New query started, cancelling tail recording');
        this.profiler?.cancelTailRecording();
      }
    }

    if (this.state.enableProfiling) {
      // Delegate to next frame to check if all queries are completed
      // This is to account for scenarios when there's "yet another" query that's started
      if (this.#tryCompleteProfileFrameId) {
        cancelAnimationFrame(this.#tryCompleteProfileFrameId);
      }

      this.#tryCompleteProfileFrameId = requestAnimationFrame(() => {
        this.profiler?.tryCompletingProfile();
      });
    }
  }

  public cancelAll() {
    for (const entry of this.#running.values()) {
      entry.cancel?.();
    }
  }
}
