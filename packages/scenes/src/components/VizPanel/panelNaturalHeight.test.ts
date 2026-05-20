import { LoadingState, PanelPlugin, type PanelProps, toDataFrame } from '@grafana/data';

import { SceneDataNode } from '../../core/SceneDataNode';

import { resolvePanelNaturalHeight } from './panelNaturalHeight';
import { getVizPanelChromeOverhead } from './panelChromeSize';
import { VizPanel } from './VizPanel';

type NaturalHeightSupplier = NonNullable<
  PanelPlugin & { getNaturalHeight?: (ctx: unknown) => number | undefined }
>['getNaturalHeight'];

function getTestPlugin(supplier?: NaturalHeightSupplier) {
  const plugin = new PanelPlugin((_props: PanelProps) => null);
  plugin.meta = { ...plugin.meta, id: 'test', name: 'Test' };
  if (supplier) {
    (plugin as PanelPlugin & { getNaturalHeight?: NaturalHeightSupplier }).getNaturalHeight = supplier;
  }
  return plugin;
}

describe('VizPanel natural height', () => {
  it('returns undefined when the plugin has no supplier', () => {
    const panel = new VizPanel({
      pluginId: 'test',
      title: 'Test',
      $data: new SceneDataNode({
        data: { state: LoadingState.Done, series: [], timeRange: {} as never },
      }),
    });
    panel['_plugin'] = getTestPlugin();

    expect(panel.getNaturalHeight({ width: 400, minHeight: 100, maxHeight: 500 })).toBeUndefined();
  });

  it('returns undefined when the supplier opts out', () => {
    const panel = new VizPanel({
      pluginId: 'test',
      title: 'Test',
      $data: new SceneDataNode({
        data: {
          state: LoadingState.Done,
          series: [toDataFrame({ name: 'A', fields: [] })],
          timeRange: {} as never,
        },
      }),
    });
    panel['_plugin'] = getTestPlugin(() => undefined);

    expect(panel.getNaturalHeight({ width: 400, minHeight: 100, maxHeight: 500 })).toBeUndefined();
  });

  it('delegates to the plugin with data, options, constraints, and chrome overhead', () => {
    const supplier = jest.fn(() => 240);
    const panel = new VizPanel({
      pluginId: 'test',
      title: 'Test',
      options: { foo: 'bar' },
      $data: new SceneDataNode({
        data: {
          state: LoadingState.Done,
          series: [toDataFrame({ name: 'A', fields: [{ name: 'v', type: 'number', values: [1] }] })],
          timeRange: {} as never,
        },
      }),
    });
    panel['_plugin'] = getTestPlugin(supplier);

    expect(panel.getNaturalHeight({ width: 512, minHeight: 168, maxHeight: 800 })).toBe(240);
    expect(supplier).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 512,
        minHeight: 168,
        maxHeight: 800,
        chromeOverhead: getVizPanelChromeOverhead(panel),
        options: { foo: 'bar' },
        data: expect.objectContaining({ state: LoadingState.Done }),
      })
    );
    expect(resolvePanelNaturalHeight(panel, { width: 512, minHeight: 168, maxHeight: 800 })).toBe(240);
  });

  it('uses a smaller chrome overhead when hoverHeader is enabled', () => {
    const panel = new VizPanel({ pluginId: 'test', title: 'Test', hoverHeader: true });
    panel['_plugin'] = getTestPlugin();

    expect(panel.getChromeOverhead()).toBeLessThan(
      getVizPanelChromeOverhead(new VizPanel({ pluginId: 'test', title: 'Test' }))
    );
  });
});
