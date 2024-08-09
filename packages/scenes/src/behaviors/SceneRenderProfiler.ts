import { writeSceneLog } from '../utils/writeSceneLog';
import { SceneQueryControllerLike } from './types';

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow

export class SceneRenderProfiler {
  #profileInProgress: {
    // Profile origin, i.e. scene refresh picker
    origin: string;
    crumbs: string[];
  } | null = null;

  #profileStartTs: number | null = null;
  #trailAnimationFrameId: number | null = null;

  // Will keep measured lengths trailing frames
  #recordedTrailingSpans: number[] = [];

  lastFrameTime: number = 0;

  public constructor(private queryController: SceneQueryControllerLike) {}

  public startProfile(name: string) {
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;

      writeSceneLog(this.constructor.name, 'New profile: Stopped recording frames');
    }

    this.#profileInProgress = { origin: name, crumbs: [] };
    this.#profileStartTs = performance.now();
    writeSceneLog(this.constructor.name, 'Profile started:', this.#profileInProgress, this.#profileStartTs);
  }

  private recordProfileTail(measurementStartTime: number, profileStartTs: number) {
    this.#trailAnimationFrameId = requestAnimationFrame(() =>
      this.measureTrailingFrames(measurementStartTime, measurementStartTime, profileStartTs)
    );
  }

  private measureTrailingFrames = (measurementStartTs: number, lastFrameTime: number, profileStartTs: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;
    this.#recordedTrailingSpans.push(frameLength);

    if (currentFrameTime - measurementStartTs! < POST_STORM_WINDOW) {
      this.#trailAnimationFrameId = requestAnimationFrame(() =>
        this.measureTrailingFrames(measurementStartTs, currentFrameTime, profileStartTs)
      );
    } else {
      const slowFrames = processRecordedSpans(this.#recordedTrailingSpans);
      const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);
      writeSceneLog(
        this.constructor.name,
        'Profile tail recorded, slow frames duration:',
        slowFramesTime,
        slowFrames,
        this.#profileInProgress
      );

      this.#recordedTrailingSpans = [];

      // Using performance api to calculate sum of all network requests time starting at performance.now() -profileDuration - slowFramesTime
      // const entries = performance.getEntriesByType('resource');

      const n = performance.now();

      const profileDuration = measurementStartTs - profileStartTs;
      writeSceneLog(
        this.constructor.name,
        'Stoped recording, total measured time (network included):',
        profileDuration + slowFramesTime
      );
      this.#trailAnimationFrameId = null;
      performance.measure('DashboardInteraction tail', {
        start: measurementStartTs,
        end: measurementStartTs + n,
      });
      performance.measure('DashboardInteraction', {
        start: profileStartTs,
        end: profileStartTs + profileDuration + slowFramesTime,
      });

      if (this.queryController.state.onProfileComplete) {
        this.queryController.state.onProfileComplete({
          origin: this.#profileInProgress!.origin,
          crumbs: this.#profileInProgress!.crumbs,
          duration: profileDuration + slowFramesTime,
        });
      }
      // @ts-ignore
      if (window.__runs) {
        // @ts-ignore
        window.__runs += `${Date.now()}, ${profileDuration + slowFramesTime}\n`;
      } else {
        // @ts-ignore
        window.__runs = `${Date.now()}, ${profileDuration + slowFramesTime}\n`;
      }
    }
  };

  public tryCompletingProfile() {
    writeSceneLog(this.constructor.name, 'Trying to complete profile', this.#profileInProgress);
    if (this.queryController.runningQueriesCount() === 0 && this.#profileInProgress) {
      writeSceneLog(this.constructor.name, 'All queries completed, stopping profile');
      this.recordProfileTail(performance.now(), this.#profileStartTs!);
    }
  }

  public isTailRecording() {
    return Boolean(this.#trailAnimationFrameId);
  }
  public cancelTailRecording() {
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;
      writeSceneLog(this.constructor.name, 'Cancelled recording frames, new profile started');
    }
  }

  public addCrumb(crumb: string) {
    if (this.#profileInProgress) {
      this.#profileInProgress.crumbs.push(crumb);
    }
  }
}

function processRecordedSpans(spans: number[]) {
  // identifie last span in spans that's bigger than 50
  for (let i = spans.length - 1; i >= 0; i--) {
    if (spans[i] > SPAN_THRESHOLD) {
      return spans.slice(0, i + 1);
    }
  }
  return [spans[0]];
}
