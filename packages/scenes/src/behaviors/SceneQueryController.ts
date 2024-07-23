import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneObjectState, SceneStatelessBehavior } from '../core/types';
import { DataQueryRequest } from '@grafana/data';
import { LoadingState } from '@grafana/schema';

export interface SceneQueryStateControllerState extends SceneObjectState {
  isRunning: boolean;
}

const POST_STORM_WINDOW = 1000;
const LEAD_RECORDING_TIME = 500;
export interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
  isQueryController: true;
  cancelAll(): void;

  queryStarted(entry: SceneQueryControllerEntry): void;
  queryCompleted(entry: SceneQueryControllerEntry): void;
  startTransaction(source: SceneObject): void;
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

  #running = new Set<SceneQueryControllerEntry>();

  #transactionInProgress: {
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

  public constructor() {
    super({ isRunning: false });

    // Clear running state on deactivate
    this.addActivationHandler(() => {
      return () => this.#running.clear();
    });
  }

  public startTransaction(source: SceneObject) {
    // cancel any running frame measurements
    if (this.#trailAnimationFrameId) {
      cancelAnimationFrame(this.#trailAnimationFrameId);
      this.#trailAnimationFrameId = null;
      console.log('\tNew transaction: Stopped recording frames');
    }

    // if there is anu running lead frame measurements, cancel them
    if (this.#leadAnimationFrameId) {
      console.log('\tNew transaction: Stopped recording lead frames');
      cancelAnimationFrame(this.#leadAnimationFrameId);
      this.#leadAnimationFrameId = null;
    }

    if (this.#transactionInProgress && this.#transactionStartTs) {
      // continue transaction, capture what was the source of continuation
      this.#transactionInProgress.crumbs.push(source.constructor.name);
      console.log('\tMeasurement transaction continued:', this.#transactionInProgress);
    } else {
      // start new transaction
      // capture transaction start time
      this.#transactionInProgress = { origin: source.constructor.name, crumbs: [] };
      this.#transactionStartTs = performance.now();
      console.log('\tMeasurement transaction started:', this.#transactionInProgress, this.#transactionStartTs);

      // start recording leading frames
      // this will capture LEAD_RECORDING_TIME frames after transaction start to detect network silence
      // if there there will be no network requests, then transaction will be completed
      this.recordTransactionLead(this.#transactionStartTs);
    }
  }

  private completeTransaction(end?: number): [number, number] | null {
    console.log('\tCompleting transaction');
    if (this.#transactionInProgress && this.#transactionStartTs) {
      this.#transactionEndTs = end || performance.now();
      const duration = this.#transactionEndTs - this.#transactionStartTs;

      console.log('\tTransaction completed:', this.#transactionInProgress, duration);

      this.#transactionInProgress = null;
      // this.#transactionStartTs = null;

      return [duration, this.#transactionEndTs];
    }

    return null;
  }

  public queryStarted(entry: SceneQueryControllerEntry) {
    this.#running.add(entry);

    this.changeRunningQueryCount(1);

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

  private recordTransactionTail(transactionDuration: number, measurementStartTime: number) {
    // performance.mark('frames recording start');
    this.#trailAnimationFrameId = requestAnimationFrame(() =>
      this.measureTrailingFrames(transactionDuration, measurementStartTime)
    );
  }

  private recordTransactionLead(transactionStart: number) {
    console.log('\tRecording lead frames');
    this.#leadAnimationFrameId = requestAnimationFrame(() =>
      this.measureLeadingFrames(transactionStart, transactionStart)
    );
  }

  // will capture leading frame lengths right after transaction start
  private measureLeadingFrames = (transactionStart: number, lastFrameTime: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;
    this.#recordedLeadingSpans.push(frameLength);

    // still measuring
    if (currentFrameTime - transactionStart < LEAD_RECORDING_TIME) {
      this.#leadAnimationFrameId = requestAnimationFrame(() =>
        this.measureLeadingFrames(transactionStart, currentFrameTime)
      );
    } else {
      console.log('\tStoped recording lead frames');
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

      if (networkRequestCount === 0) {
        const slowFrames = processRecordedSpans(this.#recordedLeadingSpans);
        const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);
        console.log('\tTransaction lead recorded, slow frames duration:', slowFramesTime, slowFrames);
        this.completeTransaction(transactionStart + slowFramesTime);
      }

      this.#recordedLeadingSpans = [];
      this.#leadAnimationFrameId = null;
    }
  };

  private measureTrailingFrames = (transactionDuration: number, lastFrameTime: number) => {
    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - lastFrameTime;
    this.#recordedTrailingSpans.push(frameLength);

    if (currentFrameTime - this.#transactionEndTs! < POST_STORM_WINDOW) {
      this.#trailAnimationFrameId = requestAnimationFrame(() =>
        this.measureTrailingFrames(transactionDuration, currentFrameTime)
      );
    } else {
      performance.mark('frames recording end');
      const slowFrames = processRecordedSpans(this.#recordedTrailingSpans);
      const slowFramesTime = slowFrames.reduce((acc, val) => acc + val, 0);
      console.log('\tTransaction tail recorded, slow frames duration:', slowFramesTime, slowFrames);
      this.#recordedTrailingSpans = [];

      // Using performance api to calculate sum of all network requests time starting at performance.now() -transactionDuration - slowFramesTime
      const entries = performance.getEntriesByType('resource');

      const n = performance.now();
      // iterate over all entries
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        // check if entry is between the time span of transaction
        if (entry.startTime >= this.#transactionStartTs! && entry.responseEnd <= n) {
          // console.log('\t -> ', entry.name, entry.responseEnd - entry.startTime);
        }
      }
      console.log('\tStoped recording, total measured time (network included):', transactionDuration + slowFramesTime);
      this.#trailAnimationFrameId = null;

      if (window.__runs) {
        window.__runs += `${Date.now()}, ${transactionDuration + slowFramesTime}\n`;
      } else {
        window.__runs = `${Date.now()}, ${transactionDuration + slowFramesTime}\n`;
      }
    }
  };

  private changeRunningQueryCount(dir: 1 | -1) {
    /**
     * Used by grafana-image-renderer to know when all queries are completed.
     */
    (window as any).__grafanaRunningQueryCount = ((window as any).__grafanaRunningQueryCount ?? 0) + dir;

    // console.log('\tRunning queries:', (window as any).__grafanaRunningQueryCount);
    // Delegate to next frame to check if all queries are completed
    // This is to account for scenarios when there's "yet another" query that's started
    // I.e. when transaction is "continued", i.e. refresh clicked multiple times and queries cancelled
    // the transaction is not completed as the cancelled queries are replaced with new refreshed queries
    requestAnimationFrame(() => {
      this.tryCompletingTransaction();
    });
  }

  private tryCompletingTransaction() {
    if (this.#running.size === 0 && this.#transactionInProgress) {
      // If "all" queries completed, wait for lead frames to complete just in case there was another request that was started
      if (this.#leadAnimationFrameId) {
        // console.log('\tAll queries completed, waiting for lead frames to complete', this.#leadAnimationFrameId);
        requestAnimationFrame(() => {
          this.tryCompletingTransaction();
        });
      } else {
        console.log('\tAll queries completed, stopping transaction');
        const completedTransaction = this.completeTransaction();
        if (completedTransaction !== null) {
          this.recordTransactionTail(completedTransaction[0], completedTransaction[1]);
        }
      }
    }
  }

  public cancelAll() {
    for (const entry of this.#running.values()) {
      entry.cancel?.();
    }
  }
}

function processRecordedSpans(spans: number[]) {
  // identifie last span in spans that's bigger than 50
  for (let i = spans.length - 1; i >= 0; i--) {
    if (spans[i] > 50) {
      return spans.slice(0, i + 1);
    }
  }
  return [spans[0]];
}
