import { type PanelData, type PanelPlugin } from '@grafana/data';

import { sceneGraph } from '../../core/sceneGraph';

import { getVizPanelChromeOverhead } from './panelChromeSize';
import { VizPanel } from './VizPanel';

export interface PanelNaturalHeightConstraints {
  /** Inner content width in pixels (typically the container's clientWidth). */
  width: number;
  /** User-configured floor (px). The plugin must clamp to this. */
  minHeight: number;
  /** User-configured cap (px). Use `Number.POSITIVE_INFINITY` when unlimited. */
  maxHeight: number;
}

/** Until @grafana/data types {@link PanelPlugin.getNaturalHeight}. */
type PanelPluginWithNaturalHeight = PanelPlugin & {
  getNaturalHeight?: (ctx: {
    data: PanelData;
    options: unknown;
    width: number;
    minHeight: number;
    maxHeight: number;
    chromeOverhead?: number;
  }) => number | undefined;
};

/**
 * Resolves natural height for a panel by delegating to its plugin supplier.
 * @internal Used by {@link VizPanel.getNaturalHeight}.
 */
export function resolvePanelNaturalHeight(
  panel: VizPanel,
  constraints: PanelNaturalHeightConstraints
): number | undefined {
  const plugin = panel.getPlugin() as PanelPluginWithNaturalHeight | undefined;
  const getNaturalHeight = plugin?.getNaturalHeight;
  if (!getNaturalHeight) {
    return undefined;
  }

  const data = sceneGraph.getData(panel).state.data;
  if (!data) {
    return undefined;
  }

  return getNaturalHeight({
    data,
    options: panel.state.options,
    width: constraints.width,
    minHeight: constraints.minHeight,
    maxHeight: constraints.maxHeight,
    chromeOverhead: getVizPanelChromeOverhead(panel),
  });
}
