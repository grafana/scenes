import { SceneObjectBase } from '../core/SceneObjectBase';
import { writeSceneLog } from '../utils/writeSceneLog';
import { captureNetwork } from './SceneRenderProfiler';
import { InteractionProfileResult, InteractionProfilerState } from './types';

export function isInteractionProfiler(obj: any): obj is SceneInteractionProfiler {
  return obj && typeof obj === 'object' && 'isInteractionProfiler' in obj;
}

export class SceneInteractionProfiler extends SceneObjectBase<InteractionProfilerState> {
  public isInteractionProfiler: true = true;
  #profileInProgress: {
    interaction: string;
    startTs: number;
  } | null = null;

  public startProfile(interaction: string) {
    if (!this.state.enableProfiling) {
      return;
    }

    // Cancel any existing profile
    if (this.#profileInProgress) {
      this.cancelProfile();
    }

    this.#profileInProgress = {
      interaction,
      startTs: performance.now(),
    };

    writeSceneLog('SceneInteractionProfiler', 'Started profiling interaction:', interaction);
  }

  public stopProfile() {
    if (!this.#profileInProgress) {
      return;
    }

    const endTs = performance.now();
    const interactionDuration = endTs - this.#profileInProgress.startTs;

    // Capture network requests that occurred during the interaction
    const networkDuration = captureNetwork(this.#profileInProgress.startTs, endTs);

    const result: InteractionProfileResult = {
      interaction: this.#profileInProgress.interaction,
      interactionDuration,
      networkDuration,
      startTs: this.#profileInProgress.startTs,
      endTs,
    };

    writeSceneLog('SceneInteractionProfiler', 'Completed profile:', result);

    if (this.state.onProfileComplete) {
      this.state.onProfileComplete(result);
    }

    // Create performance marks for browser dev tools
    performance.mark(`${this.#profileInProgress.interaction}_start`, {
      startTime: this.#profileInProgress.startTs,
    });
    performance.mark(`${this.#profileInProgress.interaction}_end`, {
      startTime: endTs,
    });
    performance.measure(
      `Interaction_${this.#profileInProgress.interaction}`,
      `${this.#profileInProgress.interaction}_start`,
      `${this.#profileInProgress.interaction}_end`
    );

    this.#profileInProgress = null;
  }

  private cancelProfile() {
    if (this.#profileInProgress) {
      writeSceneLog('SceneInteractionProfiler', 'Cancelled profile:', this.#profileInProgress.interaction);
      this.#profileInProgress = null;
    }
  }

  public isProfileActive(): boolean {
    return this.#profileInProgress !== null;
  }

  public getCurrentInteraction(): string | null {
    return this.#profileInProgress?.interaction ?? null;
  }
}

// Interaction constants for common use cases
export const USER_INTERACTIONS = {
  ADHOC_KEYS_DROPDOWN: 'adhoc_keys_dropdown',
  ADHOC_VALUES_DROPDOWN: 'adhoc_values_dropdown',
  GROUPBY_DROPDOWN: 'groupby_dropdown',
} as const;
