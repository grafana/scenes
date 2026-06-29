import { createContext } from 'react';

export interface VizPanelFitContextValue {
  /**
   * When true the panel renders in content-fit mode: no fixed height, in normal
   * flow, so its content drives the height. The surrounding layout is expected
   * to enforce the max via CSS. Provided by content-aware layouts.
   */
  enabled: boolean;
  /**
   * Minimum height (px) applied to the panel chrome so it still fills a floor
   * when its content is shorter. The max is enforced by the layout's CSS.
   */
  minHeight?: number;
}

/**
 * Lets a layout tell {@link VizPanelRenderer} to render a panel in content-fit
 * mode. Render-scoped on purpose — it reflects how the panel is being laid out
 * right now, not persisted panel state.
 */
export const VizPanelFitContext = createContext<VizPanelFitContextValue>({ enabled: false });
