import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneStatelessBehavior } from '../core/types';
import { DataQueryRequest } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { writeSceneLog } from '../utils/writeSceneLog';

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

const POST_STORM_WINDOW = 2000; // Time after last query to observe slow frames
const LEAD_RECORDING_TIME = 500;
const SPAN_THRESHOLD = 30; // Frames longer than this will be considered slow

export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
  startProfile(source: SceneObject): void;
  runningQueriesCount(): number;
}

export function isQueryController(s: SceneObject | SceneStatelessBehavior): s is SceneQueryControllerLike {
  return 'isQueryController' in s;
}

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

export class SceneQueryController
  extends SceneObjectBase<SceneQueryStateControllerState>
  implements SceneQueryControllerLike
{
  public isQueryController: true = true;
  private profiler = new SceneRenderProfiler(this);

  #running = new Set<SceneQueryControllerEntry>();

  #tryCompleteProfileFrameId: number | null = null;

  // lastFrameTime: number = 0;

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
  public startProfile(source: SceneObject) {
    this.profiler.startProfile(source.constructor.name);
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

    // console.log('\tRunning queries:', (window as any).__grafanaRunningQueryCount);
    if (dir === 1) {
      if (entry) {
        // Collect profile crumbs, variables, annotations and queries
        this.profiler.addCrumb(entry.origin.constructor.name);
      }
      if (this.profiler.isTailRecording()) {
        writeSceneLog(this.constructor.name, 'New query started, cancelling tail recording');
        this.profiler.cancelTailRecording();
      }
    }
    // console.log('\tRunning queries:', (window as any).__grafanaRunningQueryCount);
    // Delegate to next frame to check if all queries are completed
    // This is to account for scenarios when there's "yet another" query that's started
    // I.e. when transaction is "continued", i.e. refresh clicked multiple times and queries cancelled
    // the transaction is not completed as the cancelled queries are replaced with new refreshed queries

    if (this.#tryCompleteProfileFrameId) {
      cancelAnimationFrame(this.#tryCompleteProfileFrameId);
    }
    this.#tryCompleteProfileFrameId = requestAnimationFrame(() => {
      this.profiler.tryCompletingProfile();
    });
  }

  public cancelAll() {
    for (const entry of this.#running.values()) {
      entry.cancel?.();
    }
  }
}

class SceneRenderProfiler {
  #transactionInProgress: {
    // Transaction origin, i.e. scene refresh picker
    origin: string;
    crumbs: string[];
  } | null = null;

  #transactionStartTs: number | null = null;
  #transactionEndTs: number | null = null;
  #trailAnimationFrameId: number | null = null;
  #leadAnimationFrameId: number | null = null;

  // Will keep measured lengths of leading and trailing frames
  #recordedLeadingSpans: number[] = [];
  #recordedTrailingSpans: number[] = [];

  lastFrameTime: number = 0;

  public constructor(private queryController: SceneQueryControllerLike) {}

  public startProfile(name: string) {
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;

      writeSceneLog(this.constructor.name, 'New transaction: Stopped recording frames');
    }

    this.#transactionInProgress = { origin: name, crumbs: [] };
    this.#transactionStartTs = performance.now();
    writeSceneLog(
      this.constructor.name,
      'Measurement transaction started:',
      this.#transactionInProgress,
      this.#transactionStartTs
    );

    // start recording leading frames
    // this will capture LEAD_RECORDING_TIME frames after transaction start to detect network silence
    // if there there will be no network requests, then transaction will be completed
    // this.recordProfileLead(this.#transactionStartTs);
  }

  private completeProfile(end?: number): [number, number] | null {
    writeSceneLog(this.constructor.name, 'Completing transaction');
    if (this.#transactionInProgress && this.#transactionStartTs) {
      this.#transactionEndTs = end || performance.now();
      const duration = this.#transactionEndTs - this.#transactionStartTs;

      writeSceneLog(this.constructor.name, 'Transaction completed:', this.#transactionInProgress, duration);

      // this.#transactionInProgress = null;
      // this.#transactionStartTs = null;

      return [duration, this.#transactionEndTs];
    }

    return null;
  }

  private recordProfileTail(measurementStartTime: number, transactionStartTs: number) {
    this.#trailAnimationFrameId = requestAnimationFrame(() =>
      this.measureTrailingFrames(measurementStartTime, measurementStartTime, transactionStartTs)
    );
  }

  // private recordProfileLead(transactionStart: number) {
  //   performance.mark('lead frames recording start');
  //   this.#leadAnimationFrameId = requestAnimationFrame(() =>
  //     this.measureLeadingFrames(transactionStart, transactionStart)
  //   );
  // }

  private measureTrailingFrames = (measurementStartTs: number, lastFrameTime: number, transactionStartTs: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;
    this.#recordedTrailingSpans.push(frameLength);

    if (currentFrameTime - measurementStartTs! < POST_STORM_WINDOW) {
      this.#trailAnimationFrameId = requestAnimationFrame(() =>
        this.measureTrailingFrames(measurementStartTs, currentFrameTime, transactionStartTs)
      );
    } else {
      const slowFrames = processRecordedSpans(this.#recordedTrailingSpans);
      const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);
      writeSceneLog(
        this.constructor.name,
        'Transaction tail recorded, slow frames duration:',
        slowFramesTime,
        slowFrames,
        this.#transactionInProgress
      );

      this.#recordedTrailingSpans = [];

      // Using performance api to calculate sum of all network requests time starting at performance.now() -transactionDuration - slowFramesTime
      // const entries = performance.getEntriesByType('resource');

      const n = performance.now();

      const transactionDuration = measurementStartTs - transactionStartTs;
      writeSceneLog(
        this.constructor.name,
        'Stoped recording, total measured time (network included):',
        transactionDuration + slowFramesTime
      );
      this.#trailAnimationFrameId = null;
      performance.measure('DashboardInteraction tail', {
        start: measurementStartTs,
        end: measurementStartTs + n,
      });
      // console.log({ start: transactionStartTs, end: transactionStartTs + transactionDuration + slowFramesTime });
      performance.measure('DashboardInteraction', {
        start: transactionStartTs,
        end: transactionStartTs + transactionDuration + slowFramesTime,
      });

      if (this.queryController.state.onProfileComplete) {
        this.queryController.state.onProfileComplete({
          origin: this.#transactionInProgress!.origin,
          crumbs: this.#transactionInProgress!.crumbs,
          duration: transactionDuration + slowFramesTime,
        });
      }
      // @ts-ignore
      if (window.__runs) {
        // @ts-ignore
        window.__runs += `${Date.now()}, ${transactionDuration + slowFramesTime}\n`;
      } else {
        // @ts-ignore
        window.__runs = `${Date.now()}, ${transactionDuration + slowFramesTime}\n`;
      }
    }
  };

  public tryCompletingProfile() {
    writeSceneLog(this.constructor.name, 'Trying to complete profile', this.#transactionInProgress);
    if (this.queryController.runningQueriesCount() === 0 && this.#transactionInProgress) {
      writeSceneLog(this.constructor.name, 'All queries completed, stopping transaction');
      this.recordProfileTail(performance.now(), this.#transactionStartTs!);
    }
  }

  public isTailRecording() {
    return Boolean(this.#trailAnimationFrameId);
  }
  public cancelTailRecording() {
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;
      writeSceneLog(this.constructor.name, 'Cancelled recording frames, new transaction started');
    }
  }

  public addCrumb(crumb: string) {
    if (this.#transactionInProgress) {
      this.#transactionInProgress.crumbs.push(crumb);
    }
  }

  // will capture leading frame lengths right after transaction start
  private measureLeadingFrames = (transactionStart: number, lastFrameTime: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;
    // console.log('\tRecording lead frames', frameLength);
    this.#recordedLeadingSpans.push(frameLength);

    // still measuring
    if (currentFrameTime - transactionStart < LEAD_RECORDING_TIME) {
      this.#leadAnimationFrameId = requestAnimationFrame(() =>
        this.measureLeadingFrames(transactionStart, currentFrameTime)
      );
    } else {
      console.log('\tStoped recording lead frames');
      // performance.mark('lead frames recording stop');
      performance.measure('Lead recording', {
        start: transactionStart,
        end: currentFrameTime,
      });

      const networkEntries = Array.from(performance.getEntriesByType('resource'));
      let i = networkEntries.length - 1;
      let networkRequestCount = 0;

      // iterate back until transaction start time to count any network requests.
      // if there were no network requests, then complete transaction
      while (i > 0) {
        const entry = networkEntries[i];
        // whitelist API requests we are interested in observing
        const regex = /\b(api\/query|api\/annotations)\b/;

        const hasMatch = regex.test(entry.name);
        if (hasMatch && entry.startTime >= this.#transactionStartTs!) {
          networkRequestCount++;
        }
        i--;
      }

      // if there were no network requests, and no new requests were issued during lead frames recording, complete
      if (networkRequestCount === 0 && this.queryController.runningQueriesCount() === 0) {
        const slowFrames = processRecordedSpans(this.#recordedLeadingSpans);
        const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);
        // console.log('\tTransaction lead recorded, slow frames duration:', slowFramesTime, slowFrames);

        const profile = this.completeProfile(transactionStart + slowFramesTime);

        if (profile !== null) {
          console.log('\tStoped recording, total measured time (network included):', profile[0]);
          performance.measure('Lead Calculation', {
            start: transactionStart,
            end: transactionStart + profile[0],
          });
          // @ts-ignore
          if (window.__runs) {
            // @ts-ignore
            window.__runs += `${Date.now()}, ${profile[0]}\n`;
          } else {
            // @ts-ignore
            window.__runs = `${Date.now()}, ${profile[0]}\n`;
          }
        }
      }

      this.#recordedLeadingSpans = [];
      this.#leadAnimationFrameId = null;
    }
  };
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
