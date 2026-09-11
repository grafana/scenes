import React, { createContext, useMemo } from 'react';

interface VizPanelFitContextValue {
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
 * Internal channel between {@link VizPanelFitScope} and the VizPanel renderer.
 * Render-scoped on purpose — it reflects how the panel is being laid out right
 * now, not persisted panel state. Not part of the public API; layouts should
 * use {@link VizPanelFitScope}.
 */
export const VizPanelFitContext = createContext<VizPanelFitContextValue>({ enabled: false });

export interface VizPanelFitScopeProps extends VizPanelFitContextValue {
  children: React.ReactNode;
}

/**
 * Marks a subtree in which VizPanels render in content-fit mode: the panel is
 * laid out in normal flow with no fixed height so its content drives the
 * height, floored at `minHeight`. The surrounding layout is expected to bound
 * the max via CSS. Used by content-aware layouts (e.g. auto grid cells).
 */
export function VizPanelFitScope({ enabled, minHeight, children }: VizPanelFitScopeProps) {
  const value = useMemo(() => ({ enabled, minHeight }), [enabled, minHeight]);
  return <VizPanelFitContext.Provider value={value}>{children}</VizPanelFitContext.Provider>;
}
