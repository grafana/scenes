import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneStatelessBehavior } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneRenderProfiler } from './SceneRenderProfiler';
import { SceneQueryControllerEntry, SceneQueryControllerLike, SceneQueryStateControllerState } from './types';

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

export class SceneQueryController
  extends SceneObjectBase<SceneQueryStateControllerState>
  implements SceneQueryControllerLike
{
  public isQueryController: true = true;
  private profiler = new SceneRenderProfiler(this);

  #running = new Set<SceneQueryControllerEntry>();

  #tryCompleteProfileFrameId: number | null = null;

  public constructor(state: Partial<SceneQueryStateControllerState> = {}) {
    super({ ...state, isRunning: false });

    // Clear running state on deactivate
    this.addActivationHandler(() => {
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
    this.profiler.startProfile(name);
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
        this.profiler.addCrumb(`${entry.origin.constructor.name}/${entry.type}`);
      }
      if (this.profiler.isTailRecording()) {
        writeSceneLog(this.constructor.name, 'New query started, cancelling tail recording');
        this.profiler.cancelTailRecording();
      }
    }

    if (this.state.enableProfiling) {
      // Delegate to next frame to check if all queries are completed
      // This is to account for scenarios when there's "yet another" query that's started
      if (this.#tryCompleteProfileFrameId) {
        cancelAnimationFrame(this.#tryCompleteProfileFrameId);
      }

      this.#tryCompleteProfileFrameId = requestAnimationFrame(() => {
        this.profiler.tryCompletingProfile();
      });
    }
  }

  public cancelAll() {
    for (const entry of this.#running.values()) {
      entry.cancel?.();
    }
  }
}
