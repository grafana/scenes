import {
  type DataFrame,
  type DataTransformerConfig,
  FieldType,
  LoadingState,
  getDefaultTimeRange,
  toDataFrame,
} from '@grafana/data';
import { setPluginImportUtils } from '@grafana/runtime';
import { type Observable, map } from 'rxjs';

import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';
import { SceneDataNode } from '../../core/SceneDataNode';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import { mockTransformationsRegistry } from '../../utils/mockTransformationsRegistry';
import { VizPanel } from './VizPanel';

setPluginImportUtils({
  importPanelPlugin: (id: string) => Promise.resolve(getPanelPlugin({ id })),
  getPanelPluginFromCache: (id: string) => getPanelPlugin({ id }),
});

describe('VizPanel runtime transformations', () => {
  beforeAll(() => {
    mockTransformationsRegistry([
      {
        id: 'runtimeMath',
        name: 'runtimeMath',
        operator: (options: { operation: 'add' | 'multiply'; value: number }) => (source: Observable<DataFrame[]>) =>
          source.pipe(
            map((frames) =>
              frames.map((frame) => ({
                ...frame,
                fields: frame.fields.map((field) => ({
                  ...field,
                  values: field.values.map((value) =>
                    options.operation === 'add' ? value + options.value : value * options.value
                  ),
                })),
              }))
            )
          ),
      },
    ]);
  });

  function setup(panelState: Partial<ConstructorParameters<typeof VizPanel>[0]> = {}) {
    const source = new SceneDataNode({
      data: {
        state: LoadingState.Done,
        timeRange: getDefaultTimeRange(),
        series: [toDataFrame({ fields: [{ name: 'value', type: FieldType.number, values: [1] }] })],
      },
    });
    const transformer = new SceneDataTransformer({ $data: source, transformations: [] });
    const panel = new VizPanel({ pluginId: 'table', $data: transformer, ...panelState });

    source.activate();
    const deactivateTransformer = transformer.activate();

    return { deactivateTransformer, panel, source, transformer };
  }

  it('exposes a stable empty snapshot without registering a transformation', () => {
    const panel = new VizPanel({ pluginId: 'table' });
    const controller = panel.getRuntimeTransformations();

    expect(controller.get('table:columns')).toBe(controller.get('table:columns'));
    expect(controller.get('table:columns')).toEqual([]);
  });

  it('stores immutable owner snapshots and notifies only that owner', () => {
    const panel = new VizPanel({ pluginId: 'table' });
    const controller = panel.getRuntimeTransformations();
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const transformations: DataTransformerConfig[] = [{ id: 'organize', options: { excludeByName: { B: true } } }];

    controller.subscribe('table:columns', firstListener);
    controller.subscribe('other:owner', secondListener);
    controller.set('table:columns', transformations);
    const snapshot = controller.get('table:columns');
    transformations.push({ id: 'noop', options: {} });

    expect(snapshot).toEqual([{ id: 'organize', options: { excludeByName: { B: true } } }]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(controller.get('table:columns')).toBe(snapshot);
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).not.toHaveBeenCalled();

    controller.set('table:columns', []);

    expect(controller.get('table:columns')).toEqual([]);
    expect(firstListener).toHaveBeenCalledTimes(2);
  });

  it('copies nested transformation options into the owner snapshot', () => {
    const panel = new VizPanel({ pluginId: 'table' });
    const controller = panel.getRuntimeTransformations();
    const options = { excludeByName: { B: true } };

    controller.set('table:columns', [{ id: 'organize', options }]);
    options.excludeByName.B = false;

    expect(controller.get('table:columns')).toEqual([{ id: 'organize', options: { excludeByName: { B: true } } }]);
  });

  it('freezes nested transformation options in the owner snapshot', () => {
    const panel = new VizPanel({ pluginId: 'table' });
    const controller = panel.getRuntimeTransformations();

    controller.set('table:columns', [{ id: 'organize', options: { excludeByName: { B: true } } }]);
    const snapshot = controller.get('table:columns');
    const options = snapshot[0].options as { excludeByName: { B: boolean } };

    expect(() => {
      options.excludeByName.B = false;
    }).toThrow(TypeError);
    expect(options.excludeByName.B).toBe(true);
  });

  it('runs groups in active registration order and captures each stage input', () => {
    const { panel, transformer } = setup();
    const controller = panel.getRuntimeTransformations();
    const add = (value: number): DataTransformerConfig => ({
      id: 'runtimeMath',
      options: { operation: 'add', value },
    });
    const multiply = (value: number): DataTransformerConfig => ({
      id: 'runtimeMath',
      options: { operation: 'multiply', value },
    });

    controller.set('first', [add(1)]);
    controller.set('second', [multiply(10)]);

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([20]);
    expect(controller.getSourceSeries('first')[0].fields[0].values).toEqual([1]);
    expect(controller.getSourceSeries('second')[0].fields[0].values).toEqual([2]);

    controller.set('first', [add(2)]);

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([30]);

    controller.set('first', []);
    controller.set('first', [add(2)]);

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([12]);
  });

  it('clears every group and restores field cleanup when the plugin changes', () => {
    const { panel, transformer } = setup({ _UNSAFE_clearPreviousFieldValues: true });
    const controller = panel.getRuntimeTransformations();
    const firstListener = jest.fn();
    const secondListener = jest.fn();

    controller.subscribe('first', firstListener);
    controller.subscribe('second', secondListener);
    controller.set('first', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);
    controller.set('second', [{ id: 'runtimeMath', options: { operation: 'multiply', value: 10 } }]);

    expect(panel.state._UNSAFE_clearPreviousFieldValues).toBe(false);

    panel.setState({ pluginId: 'timeseries' });

    expect(controller.get('first')).toEqual([]);
    expect(controller.get('second')).toEqual([]);
    expect(panel.state._UNSAFE_clearPreviousFieldValues).toBe(true);
    expect(transformer.state.data?.series[0].fields[0].values).toEqual([1]);
    expect(firstListener).toHaveBeenCalledTimes(2);
    expect(secondListener).toHaveBeenCalledTimes(2);
  });

  it('keeps the controller and source capture when active panel data is replaced', () => {
    const { panel } = setup();
    const controller = panel.getRuntimeTransformations();
    controller.set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);
    panel.activate();

    const replacementSource = new SceneDataNode({
      data: {
        state: LoadingState.Done,
        timeRange: getDefaultTimeRange(),
        series: [toDataFrame({ fields: [{ name: 'value', type: FieldType.number, values: [5] }] })],
      },
    });
    const replacement = new SceneDataTransformer({ $data: replacementSource, transformations: [] });

    panel.setState({ $data: replacement });

    expect(panel.getRuntimeTransformations()).toBe(controller);
    expect(replacement.state.data?.series[0].fields[0].values).toEqual([6]);
    expect(controller.getSourceSeries('owner')[0].fields[0].values).toEqual([5]);
  });

  it('applies an owner update made while the transformer is inactive', () => {
    const { deactivateTransformer, panel, transformer } = setup();
    const controller = panel.getRuntimeTransformations();

    controller.set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);
    expect(transformer.state.data?.series[0].fields[0].values).toEqual([2]);

    deactivateTransformer();
    controller.set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 2 } }]);

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([2]);

    transformer.activate();

    expect(transformer.state.data?.series[0].fields[0].values).toEqual([3]);
  });

  it('gives a cloned panel an empty controller and removes ephemeral output', () => {
    const { panel, transformer } = setup();
    const controller = panel.getRuntimeTransformations();
    controller.set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);

    const clone = panel.clone();
    const clonedTransformer = clone.state.$data as SceneDataTransformer;

    expect(clone.getRuntimeTransformations()).not.toBe(controller);
    expect(clone.getRuntimeTransformations().get('owner')).toEqual([]);
    expect(clonedTransformer.state.data).toBeUndefined();
    expect(transformer.state.data?.series[0].fields[0].values).toEqual([2]);

    clone.activate();

    expect(clonedTransformer.state.data?.series[0].fields[0].values).toEqual([1]);
  });

  it('restores the original field cleanup setting in a clone', () => {
    const { panel } = setup({ _UNSAFE_clearPreviousFieldValues: true });
    panel.getRuntimeTransformations().set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);

    const clone = panel.clone();

    expect(panel.state._UNSAFE_clearPreviousFieldValues).toBe(false);
    expect(clone.state._UNSAFE_clearPreviousFieldValues).toBe(true);
  });

  it('reprocesses the current frames without requesting source data again', () => {
    const { panel, source } = setup();
    const sourceListener = jest.fn();
    source.subscribeToState(sourceListener);

    panel.getRuntimeTransformations().set('owner', [{ id: 'runtimeMath', options: { operation: 'add', value: 1 } }]);

    expect(sourceListener).not.toHaveBeenCalled();
  });
});
