import { lastValueFrom, of } from 'rxjs';

import { FieldType, LoadingState, PanelData, toDataFrame } from '@grafana/data';

import { extraQueryProcessingOperator, passthroughProcessor } from './extraQueryProcessingOperator';
import { ExtraQueryDataProcessor } from './ExtraQueryProvider';

function makeData(refId: string, over: Partial<PanelData> = {}): PanelData {
  return {
    state: LoadingState.Done,
    series: [toDataFrame({ refId, datapoints: [[1, 1]] })],
    annotations: [],
    timeRange: {} as any,
    // The operator looks up processors by the secondary's request.requestId.
    request: { requestId: refId } as any,
    ...over,
  };
}

describe('passthroughProcessor', () => {
  it('returns the secondary data unchanged', async () => {
    const primary = makeData('A');
    const secondary = makeData('sec1');

    const result = await lastValueFrom(passthroughProcessor(primary, secondary));

    expect(result).toBe(secondary);
  });
});

describe('extraQueryProcessingOperator', () => {
  it('applies the processor matched by the secondary request id', async () => {
    const processor: ExtraQueryDataProcessor = (_primary, secondary) =>
      of({
        ...secondary,
        series: secondary.series.map((frame) => ({ ...frame, refId: `${frame.refId}-processed` })),
      });
    const processors = new Map([['sec1', processor]]);

    const result = await lastValueFrom(
      of([makeData('A'), makeData('sec1')] as [PanelData, ...PanelData[]]).pipe(
        extraQueryProcessingOperator(processors)
      )
    );

    expect(result.series.map((s) => s.refId)).toEqual(['A', 'sec1-processed']);
  });

  it('falls back to passthrough when no processor is registered for the secondary', async () => {
    const result = await lastValueFrom(
      of([makeData('A'), makeData('sec1')] as [PanelData, ...PanelData[]]).pipe(extraQueryProcessingOperator(new Map()))
    );

    expect(result.series.map((s) => s.refId)).toEqual(['A', 'sec1']);
  });

  it('keeps the primary series first and preserves secondary order', async () => {
    const result = await lastValueFrom(
      of([makeData('A'), makeData('sec1'), makeData('sec2')] as [PanelData, ...PanelData[]]).pipe(
        extraQueryProcessingOperator(new Map())
      )
    );

    expect(result.series.map((s) => s.refId)).toEqual(['A', 'sec1', 'sec2']);
  });

  it('concatenates annotations primary-first', async () => {
    const annotationFrame = (refId: string) =>
      toDataFrame({ refId, fields: [{ name: 'time', type: FieldType.time, values: [1] }] });
    const primary = makeData('A', { annotations: [annotationFrame('pa')] });
    const secondary = makeData('sec1', { annotations: [annotationFrame('sa')] });

    const result = await lastValueFrom(
      of([primary, secondary] as [PanelData, ...PanelData[]]).pipe(extraQueryProcessingOperator(new Map()))
    );

    expect(result.annotations?.map((a) => a.refId)).toEqual(['pa', 'sa']);
  });

  it('spreads the primary data so its state wins over a secondary state', async () => {
    const primary = makeData('A', { state: LoadingState.Done });
    const secondary = makeData('sec1', { state: LoadingState.Error });

    const result = await lastValueFrom(
      of([primary, secondary] as [PanelData, ...PanelData[]]).pipe(extraQueryProcessingOperator(new Map()))
    );

    expect(result.state).toBe(LoadingState.Done);
  });
});
