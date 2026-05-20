import { VizPanel } from './VizPanel';

/**
 * Default vertical space (px) for PanelChrome header, padding, and border with a
 * standard (non-hover) header.
 */
export const VIZ_PANEL_DEFAULT_CHROME_OVERHEAD_PX = 58;

const HOVER_HEADER_CHROME_OVERHEAD_PX = 32;
const PANEL_CHROME_PADDING_PX = 16;

/**
 * Estimates vertical PanelChrome overhead for a {@link VizPanel}.
 */
export function getVizPanelChromeOverhead(panel: VizPanel): number {
  if (panel.state.hoverHeader) {
    return HOVER_HEADER_CHROME_OVERHEAD_PX;
  }

  let overhead = VIZ_PANEL_DEFAULT_CHROME_OVERHEAD_PX;
  if (panel.getPlugin()?.noPadding) {
    overhead -= PANEL_CHROME_PADDING_PX;
  }

  return overhead;
}
