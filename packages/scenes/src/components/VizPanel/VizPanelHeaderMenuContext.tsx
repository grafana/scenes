import React, { createContext, useMemo } from 'react';

interface VizPanelHeaderMenuContextValue {
  /**
   * When true, hovering a panel does not reveal its header menu; the menu only
   * shows while the panel has keyboard focus. For hosts that offer the panel
   * menu in their own hover actions.
   */
  hideOnHover: boolean;
}

/**
 * Internal channel between {@link VizPanelHeaderMenuScope} and the VizPanel renderer.
 * Render-scoped on purpose — it reflects what the host renders around the panel
 * right now, not persisted panel state. Not part of the public API; hosts should
 * use {@link VizPanelHeaderMenuScope}.
 */
export const VizPanelHeaderMenuContext = createContext<VizPanelHeaderMenuContextValue>({ hideOnHover: false });

export interface VizPanelHeaderMenuScopeProps extends VizPanelHeaderMenuContextValue {
  children: React.ReactNode;
}

/**
 * Marks a subtree in which hovering a VizPanel does not reveal its header menu,
 * because the host shows the panel menu in its own hover actions. The menu
 * still shows while the panel has keyboard focus, so keyboard users keep it.
 */
export function VizPanelHeaderMenuScope({ hideOnHover, children }: VizPanelHeaderMenuScopeProps) {
  const value = useMemo(() => ({ hideOnHover }), [hideOnHover]);
  return <VizPanelHeaderMenuContext.Provider value={value}>{children}</VizPanelHeaderMenuContext.Provider>;
}
