import React from 'react';
import { PanelChrome } from '@grafana/ui';

import type { VizPanel } from './VizPanel';

export type PanelStatusSeverity = 'info' | 'warning' | 'error' | 'success';

export interface PanelStatusItem {
  severity: PanelStatusSeverity;
  text: string;
}

/**
 * Everything VizPanelRenderer has resolved for the panel chrome (header, status, sizing, drag handling etc).
 * It is the PanelChrome props plus the VizPanel they were derived from. `children` renders the panel plugin
 * body and must be called with the inner size of the content area.
 */
type PanelChromeProps = React.ComponentProps<typeof PanelChrome>;
type AllKeys<T> = T extends unknown ? keyof T : never;
type ValueOf<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? T[K] : never) : never;
/** PanelChrome props are a discriminated union (sizing, collapsible, hover header); flatten it so wrappers can pass any combination */
type FlatProps<T> = { [K in AllKeys<T>]?: ValueOf<T, K> };

export type VizPanelChromeProps = FlatProps<PanelChromeProps> & {
  /** Renders the panel plugin body; call it with the inner size of the content area */
  children: (innerWidth: number, innerHeight: number) => React.ReactNode;
  panel: VizPanel;
  subtitle?: React.ReactNode;
  statusItems?: PanelStatusItem[];
  minHeight?: number | string;
  subHeaderContent?: React.ReactNode;
};

/**
 * Component that renders the chrome around a VizPanel. Set via VizPanelState.chrome to replace PanelChrome.
 */
export type VizPanelChromeComponent = React.ComponentType<VizPanelChromeProps>;

/** Default chrome: forwards everything to Grafana's PanelChrome. */
export function VizPanelDefaultChrome({ panel, ...chromeProps }: VizPanelChromeProps) {
  return <PanelChrome {...(chromeProps as PanelChromeProps)} />;
}
