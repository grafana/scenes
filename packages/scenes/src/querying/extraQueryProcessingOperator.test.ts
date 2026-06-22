import { DataFrame, DataQueryError, LoadingState, PanelData, toDataFrame } from '@grafana/data';
import { combineLatest, Observable, of, Subject } from 'rxjs';

import { ExtraQueryDataProcessor } from './ExtraQueryProvider';
import {
  combineLoadingStates,
  extraQueryProcessingOperator,
  passthroughProcessor,
} from './extraQueryProcessingOperator';

function makePanelData(
  state: LoadingState,
  options: {
    requestId?: string;
    series?: DataFrame[];
    annotations?: DataFrame[];
    errors?: DataQueryError[];
  } = {}
): PanelData {
  return {
    state,
    series: options.series ?? [],
    annotations: options.annotations,
    errors: options.errors,
    request: { requestId: options.requestId ?? 'A' } as PanelData['request'],
    timeRange: {} as PanelData['timeRange'],
  };
}

// Synchronously collect all emissions from a source observable. Safe because all of the
// observables exercised in these tests emit synchronously.
function collect(source: Observable<PanelData>): { emissions: PanelData[]; unsubscribe: () => void } {
  const emissions: PanelData[] = [];
  const sub = source.subscribe((v) => emissions.push(v));
  return { emissions, unsubscribe: () => sub.unsubscribe() };
}

describe('combineLoadingStates', () => {
  it('returns Error when any response is in the Error state', () => {
    expect(combineLoadingStates([LoadingState.Loading, LoadingState.Error])).toBe(LoadingState.Error);
    expect(combineLoadingStates([LoadingState.Error, LoadingState.Streaming])).toBe(LoadingState.Error);
  });

  it('returns Loading when any response is loading (and none errored)', () => {
    expect(combineLoadingStates([LoadingState.Done, LoadingState.Loading])).toBe(LoadingState.Loading);
    expect(combineLoadingStates([LoadingState.Loading, LoadingState.Streaming])).toBe(LoadingState.Loading);
  });

  it('returns Streaming when any response is streaming (and none errored or loading)', () => {
    expect(combineLoadingStates([LoadingState.Done, LoadingState.Streaming])).toBe(LoadingState.Streaming);
  });

  it('returns the primary state (and nothing is errored, loading, or streaming)', () => {
    expect(combineLoadingStates([LoadingState.Done, LoadingState.Done])).toBe(LoadingState.Done);
    expect(combineLoadingStates([LoadingState.NotStarted, LoadingState.Done])).toBe(LoadingState.NotStarted);
  });

  it('falls back to Done for an empty array', () => {
    expect(combineLoadingStates([])).toBe(LoadingState.Done);
  });
});

describe('extraQueryProcessingOperator', () => {
  it('emits intermediate states as sources arrive', () => {
    const primarySubject = new Subject<PanelData>();
    const secondarySubject = new Subject<PanelData>();
    const processors = new Map<string, ExtraQueryDataProcessor>([['B', passthroughProcessor]]);

    const { emissions } = collect(
      combineLatest([primarySubject, secondarySubject]).pipe(extraQueryProcessingOperator(processors))
    );

    // combineLatest waits for every source before emitting anything.
    primarySubject.next(makePanelData(LoadingState.Done, { requestId: 'A' }));
    expect(emissions).toHaveLength(0);

    // Once the secondary primes its Loading state, the combined output should reflect Loading.
    secondarySubject.next(makePanelData(LoadingState.Loading, { requestId: 'B' }));
    expect(emissions).toHaveLength(1);
    expect(emissions[0].state).toBe(LoadingState.Loading);

    // When the secondary completes, the combined output transitions to Done.
    secondarySubject.next(makePanelData(LoadingState.Done, { requestId: 'B' }));
    expect(emissions).toHaveLength(2);
    expect(emissions[1].state).toBe(LoadingState.Done);
  });

  it('emits and aggregates errors', () => {
    const primaryError: DataQueryError = { message: 'primary boom', refId: 'A' };
    const secondaryError: DataQueryError = { message: 'secondary boom', refId: 'B' };

    const { emissions } = collect(
      of([
        makePanelData(LoadingState.Error, { requestId: 'A', errors: [primaryError] }),
        makePanelData(LoadingState.Error, { requestId: 'B', errors: [secondaryError] }),
      ] as [PanelData, PanelData]).pipe(extraQueryProcessingOperator(new Map([['B', passthroughProcessor]])))
    );

    expect(emissions).toHaveLength(1);
    expect(emissions[0].state).toBe(LoadingState.Error);
    expect(emissions[0].errors).toEqual([primaryError, secondaryError]);
    expect(emissions[0].error).toEqual(primaryError);
  });

  it('does not emit errors when no response has errors', () => {
    const { emissions } = collect(
      of([
        makePanelData(LoadingState.Done, { requestId: 'A' }),
        makePanelData(LoadingState.Done, { requestId: 'B' }),
      ] as [PanelData, PanelData]).pipe(extraQueryProcessingOperator(new Map([['B', passthroughProcessor]])))
    );

    expect(emissions[0].errors).toBeUndefined();
    expect(emissions[0].error).toBeUndefined();
  });

  it('merges primary and secondary series and annotations without mutating the primary', () => {
    const primary = makePanelData(LoadingState.Done, {
      requestId: 'A',
      series: [toDataFrame({ refId: 'A', fields: [] })],
      annotations: [toDataFrame({ refId: 'primary-annotation', fields: [] })],
    });
    const secondary = makePanelData(LoadingState.Done, {
      requestId: 'B',
      series: [toDataFrame({ refId: 'B', fields: [] })],
      annotations: [toDataFrame({ refId: 'secondary-annotation', fields: [] })],
    });

    const { emissions } = collect(
      of([primary, secondary] as [PanelData, PanelData]).pipe(
        extraQueryProcessingOperator(new Map([['B', passthroughProcessor]]))
      )
    );

    expect(emissions[0].series.map((s) => s.refId)).toEqual(['A', 'B']);
    expect(emissions[0].annotations?.map((a) => a.refId)).toEqual(['primary-annotation', 'secondary-annotation']);

    // The primary PanelData should not be mutated by the operator.
    expect(primary.series).toHaveLength(1);
    expect(primary.annotations).toHaveLength(1);
  });

  it('falls back to passing the secondary through unchanged when no processor matches its requestId', () => {
    const secondary = makePanelData(LoadingState.Done, {
      requestId: 'no-processor',
      series: [toDataFrame({ refId: 'B', fields: [] })],
    });

    const { emissions } = collect(
      of([makePanelData(LoadingState.Done, { requestId: 'A' }), secondary] as [PanelData, PanelData]).pipe(
        extraQueryProcessingOperator(new Map())
      )
    );

    expect(emissions[0].series.map((s) => s.refId)).toEqual(['B']);
  });

  it('runs each processor once per secondary response', () => {
    const primarySubject = new Subject<PanelData>();
    const secondarySubject = new Subject<PanelData>();

    let processorCalls = 0;
    // Mirror the non-idempotent timeShiftAlignmentProcessor, which mutates series.refId in place.
    const suffixProcessor: ExtraQueryDataProcessor = (_, secondary) => {
      processorCalls++;
      secondary.series.forEach((s) => {
        s.refId = `${s.refId}-compare`;
      });
      return of(secondary);
    };

    const { emissions } = collect(
      combineLatest([primarySubject, secondarySubject]).pipe(
        extraQueryProcessingOperator(new Map([['B', suffixProcessor]]))
      )
    );

    const secondary = makePanelData(LoadingState.Done, {
      requestId: 'B',
      series: [toDataFrame({ refId: 'A', fields: [] })],
    });

    primarySubject.next(makePanelData(LoadingState.Loading, { requestId: 'A' }));
    secondarySubject.next(secondary);

    // Re-emit a new primary while the SAME secondary object stays the latest value.
    // combineLatest re-emits the secondary, but the processor must not run again.
    primarySubject.next(makePanelData(LoadingState.Done, { requestId: 'A' }));

    expect(processorCalls).toBe(1);
    expect(emissions[emissions.length - 1].series.map((s) => s.refId)).toEqual(['A-compare']);
  });
});

describe('passthroughProcessor', () => {
  it('emits the secondary unchanged', (done) => {
    const secondary = makePanelData(LoadingState.Done, { requestId: 'B' });
    passthroughProcessor(makePanelData(LoadingState.Done, { requestId: 'A' }), secondary).subscribe((out) => {
      expect(out).toBe(secondary);
      done();
    });
  });
});
