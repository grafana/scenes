import { act, renderHook, waitFor } from '@testing-library/react';
import {
  DataFrame,
  FieldType,
  LoadingState,
  PanelData,
  getDefaultTimeRange,
  standardTransformers,
  toDataFrame,
} from '@grafana/data';
import { delay, map, Observable } from 'rxjs';

import { SceneDataNode } from '../../core/SceneDataNode';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import { mockTransformationsRegistry } from '../../utils/mockTransformationsRegistry';
import { VizPanel } from './VizPanel';
import { useClearPreviousData } from './VizPanelRenderer';

function frame(values = [1, 2, 3]): DataFrame {
  return toDataFrame({ fields: [{ name: 'value', type: FieldType.number, values }] });
}

function panelData(series: DataFrame[], annotations?: DataFrame[]): PanelData {
  return { state: LoadingState.Done, timeRange: getDefaultTimeRange(), series, annotations };
}

describe('retained field value cleanup', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()!();
    }
  });

  beforeAll(() => {
    mockTransformationsRegistry([
      {
        ...standardTransformers.organizeFieldsTransformer,
        operator: (options, context) => (source: Observable<DataFrame[]>) =>
          source.pipe(standardTransformers.organizeFieldsTransformer.operator(options, context), delay(0)),
      },
      {
        id: 'hide',
        name: 'hide',
        operator: () => (source: Observable<DataFrame[]>) =>
          source.pipe(map((frames) => frames.map((frame) => ({ ...frame, fields: [] })))),
      },
      {
        id: 'filter',
        name: 'filter',
        operator: () => (source: Observable<DataFrame[]>) =>
          source.pipe(
            map((frames) =>
              frames.map((frame) => ({
                ...frame,
                length: 1,
                fields: frame.fields.map((field) => ({ ...field, values: field.values.slice(0, 1) })),
              }))
            )
          ),
      },
    ]);
  });

  function setup() {
    const original = frame();
    const source = new SceneDataNode({ data: panelData([original]) });
    const transformer = new SceneDataTransformer({ $data: source, transformations: [] });
    const panel = new VizPanel({ pluginId: 'table', $data: transformer, _UNSAFE_clearPreviousFieldValues: true });
    const deactivate = transformer.activate();
    const hook = renderHook(() => {
      const { data } = transformer.useState();
      const { _UNSAFE_clearPreviousFieldValues } = panel.useState();
      useClearPreviousData(data, panel.getRetainedDataFrameSources(), _UNSAFE_clearPreviousFieldValues);
    });
    cleanups.push(() => {
      hook.unmount();
      deactivate();
    });
    return {
      original,
      source,
      transformer,
      panel,
      controller: panel.getRuntimeTransformations(),
    };
  }

  it('restores a hidden column without refetching or disabling cleanup', () => {
    const { original, source, transformer, panel, controller } = setup();
    const sourceChanged = jest.fn();
    const subscription = source.subscribeToState(sourceChanged);
    cleanups.push(() => subscription.unsubscribe());

    act(() => controller.set('columns', [{ id: 'hide', options: {} }]));

    expect(transformer.state.data?.series[0].fields).toEqual([]);
    expect(original.fields[0].values).toEqual([1, 2, 3]);
    expect(panel.state._UNSAFE_clearPreviousFieldValues).toBe(true);

    act(() => controller.set('columns', []));

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([1, 2, 3]);
    expect(sourceChanged).not.toHaveBeenCalled();
  });

  it('restores filtered rows and clears obsolete transformed output', () => {
    const { original, transformer, controller } = setup();
    act(() => controller.set('rows', [{ id: 'filter', options: {} }]));
    const filteredValues = transformer.state.data!.series[0].fields[0].values;

    expect(filteredValues).toEqual([1]);
    expect(original.fields[0].values).toEqual([1, 2, 3]);

    act(() => controller.set('rows', []));

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([1, 2, 3]);
    expect(filteredValues).toEqual([]);
  });

  it('restores values after removing the last runtime transform with asynchronous saved organize fields', async () => {
    const { source, transformer, controller } = setup();
    const original = toDataFrame({
      fields: ['savedHidden', 'runtimeHidden', 'visible'].map((name) => ({
        name,
        type: FieldType.number,
        values: [1, 2, 3],
      })),
    });
    act(() => {
      source.setState({ data: panelData([original]) });
      transformer.setState({
        transformations: [{ id: 'organize', options: { excludeByName: { savedHidden: true } } }],
      });
      transformer.reprocessTransformations();
    });
    await waitFor(() =>
      expect(transformer.state.data?.series[0].fields.map((field) => field.name)).toEqual(['runtimeHidden', 'visible'])
    );

    act(() => controller.set('columns', [{ id: 'organize', options: { excludeByName: { runtimeHidden: true } } }]));
    await waitFor(() =>
      expect(transformer.state.data?.series[0].fields.map((field) => field.name)).toEqual(['visible'])
    );

    act(() => controller.set('columns', []));
    await waitFor(() =>
      expect(transformer.state.data?.series[0].fields.map((field) => field.name)).toEqual(['runtimeHidden', 'visible'])
    );
    expect(transformer.state.data?.series[0].fields[0].values).toEqual([1, 2, 3]);
  });

  it('clears deferred hidden values after a query refresh and unhides the new values', () => {
    const { original, source, transformer, controller } = setup();
    act(() => controller.set('columns', [{ id: 'hide', options: {} }]));
    const refreshed = frame([4, 5, 6]);

    act(() => source.setState({ data: panelData([refreshed]) }));

    expect(original.fields[0].values).toEqual([]);
    expect(controller.getSourceSeries('columns')[0].fields[0].values).toEqual([4, 5, 6]);

    act(() => controller.set('columns', []));

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([4, 5, 6]);
  });

  it('protects an intermediate runtime capture absent from both query source and rendered output', () => {
    const { original, transformer, controller } = setup();
    act(() => controller.set('rows', [{ id: 'filter', options: {} }]));
    act(() => controller.set('columns', [{ id: 'hide', options: {} }]));
    const captured = controller.getSourceSeries('columns')[0].fields[0].values;

    expect(transformer.state.data?.series[0].fields).toEqual([]);
    expect(captured).toEqual([1]);
    expect(captured).not.toBe(original.fields[0].values);

    act(() => controller.set('columns', []));

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([1]);
  });

  it('skips field scans when output and retained source arrays are unchanged', () => {
    const current = frame();
    const upstream = frame([4, 5, 6]);
    const data = panelData([current]);
    const sources = [[upstream]];
    const currentFields = jest.fn().mockReturnValue(current.fields);
    const upstreamFields = jest.fn().mockReturnValue(upstream.fields);
    Object.defineProperty(current, 'fields', { get: currentFields });
    Object.defineProperty(upstream, 'fields', { get: upstreamFields });
    const { rerender } = renderHook(({ data, sources }) => useClearPreviousData(data, sources), {
      initialProps: { data, sources },
    });
    expect(currentFields).toHaveBeenCalled();
    expect(upstreamFields).toHaveBeenCalled();
    currentFields.mockClear();
    upstreamFields.mockClear();

    rerender({ data: { ...data }, sources: [...sources] });

    expect(currentFields).not.toHaveBeenCalled();
    expect(upstreamFields).not.toHaveBeenCalled();
  });

  it('releases deferred values when retention changes but output stays the same', () => {
    const original = frame();
    const output = panelData([]);
    const retained = [original];
    const { rerender } = renderHook(({ data, sources }) => useClearPreviousData(data, sources), {
      initialProps: { data: panelData([original]), sources: [retained] },
    });

    rerender({ data: output, sources: [retained] });
    expect(original.fields[0].values).toEqual([1, 2, 3]);

    rerender({ data: output, sources: [[frame([4, 5, 6])]] });
    expect(original.fields[0].values).toEqual([]);

    rerender({ data: output, sources: [] });
    expect(original.fields[0].values).toEqual([]);
  });

  it('resumes tracking unchanged data when cleanup is re-enabled', () => {
    const original = frame();
    const data = panelData([original]);
    const { rerender } = renderHook(({ data, enabled }) => useClearPreviousData(data, [], enabled), {
      initialProps: { data, enabled: true },
    });

    rerender({ data, enabled: false });
    rerender({ data, enabled: true });
    rerender({ data: panelData([]), enabled: true });

    expect(original.fields[0].values).toEqual([]);
  });

  it('protects shared values across series and annotation topics', () => {
    const shared = frame();
    const { rerender } = renderHook(({ data }) => useClearPreviousData(data, []), {
      initialProps: { data: panelData([shared]) },
    });

    rerender({ data: panelData([], [shared]) });
    expect(shared.fields[0].values).toEqual([1, 2, 3]);

    rerender({ data: panelData([]) });
    expect(shared.fields[0].values).toEqual([]);
  });

  it('does not take ownership of upstream arrays that were never rendered', () => {
    const upstream = frame();
    const { rerender } = renderHook(({ retained }) => useClearPreviousData(panelData([]), [retained]), {
      initialProps: { retained: [upstream] },
    });

    rerender({ retained: [] });
    expect(upstream.fields[0].values).toEqual([1, 2, 3]);
  });

  it('preserves streaming buffers', () => {
    const streaming = Object.assign(frame(), { appendRow: jest.fn() });
    const { rerender } = renderHook(({ data }) => useClearPreviousData(data, []), {
      initialProps: { data: panelData([streaming]) },
    });

    rerender({ data: panelData([]) });
    expect(streaming.fields[0].values).toEqual([1, 2, 3]);
  });

  it.each([false, true])('preserves cleanup tracking across missing data (retained: %s)', (retained) => {
    const original = frame();
    const refreshed = frame([4, 5, 6]);
    const { rerender } = renderHook<void, { data: PanelData | undefined; retainedFrames: DataFrame[] }>(
      ({ data, retainedFrames }) => useClearPreviousData(data, [retainedFrames]),
      { initialProps: { data: panelData([original]), retainedFrames: [original] } }
    );

    if (retained) {
      rerender({ data: panelData([]), retainedFrames: [original] });
    }
    rerender({ data: undefined, retainedFrames: retained ? [original] : [] });
    expect(original.fields[0].values).toEqual([1, 2, 3]);

    rerender({ data: panelData([refreshed]), retainedFrames: [refreshed] });
    expect(original.fields[0].values).toEqual([]);
    expect(refreshed.fields[0].values).toEqual([4, 5, 6]);
  });

  it('preserves values reused after missing data', () => {
    const original = frame();
    const { rerender } = renderHook<void, { data: PanelData | undefined }>(
      ({ data }) => useClearPreviousData(data, []),
      { initialProps: { data: panelData([original]) } }
    );

    rerender({ data: undefined });
    rerender({ data: panelData([original]) });
    expect(original.fields[0].values).toEqual([1, 2, 3]);
  });

  it.each([false, true])('stops tracking when cleanup is disabled (missing data: %s)', (missingData) => {
    const ordinary = frame();
    const { rerender } = renderHook<void, { data: PanelData | undefined; enabled: boolean }>(
      ({ data, enabled }) => useClearPreviousData(data, [], enabled),
      {
        initialProps: { data: panelData([ordinary]), enabled: true },
      }
    );

    rerender({ data: missingData ? undefined : panelData([ordinary]), enabled: false });
    rerender({ data: panelData([]), enabled: true });

    expect(ordinary.fields[0].values).toEqual([1, 2, 3]);
  });

  it.each(['series', 'annotations'] as const)(
    'retains large upstream %s lists without overflowing the stack',
    (topic) => {
      const first = frame();
      const last = frame([4, 5, 6]);
      const frames = Array<DataFrame>(200_000).fill(first);
      frames[frames.length - 1] = last;
      const source = new SceneDataNode({
        data: panelData(topic === 'series' ? frames : [], topic === 'annotations' ? frames : []),
      });
      const transformer = new SceneDataTransformer({ $data: source, transformations: [] });
      const panel = new VizPanel({ pluginId: 'table', $data: transformer });

      const retained = panel.getRetainedDataFrameSources().flat();

      expect(retained).toHaveLength(frames.length);
      expect(retained[0]).toBe(first);
      expect(retained[retained.length - 1]).toBe(last);
    }
  );

  it('protects nested and inherited transformer sources, including annotations', () => {
    const original = frame();
    const annotation = frame([10]);
    const source = new SceneDataNode({ data: panelData([original], [annotation]) });
    const upstream = new SceneDataTransformer({ $data: source, transformations: [] });
    const transformer = new SceneDataTransformer({ transformations: [] });
    const panel = new VizPanel({ pluginId: 'table', $data: transformer });
    new EmbeddedScene({ $data: upstream, body: panel });

    const deactivateUpstream = upstream.activate();
    cleanups.push(deactivateUpstream);
    const deactivate = transformer.activate();
    cleanups.push(deactivate);

    expect(panel.getRetainedDataFrameSources()).toContain(source.state.data?.series);
    expect(panel.getRetainedDataFrameSources()).toContain(source.state.data?.annotations);
  });
});
