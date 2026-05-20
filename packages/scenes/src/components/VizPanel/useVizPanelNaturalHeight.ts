import { type RefObject, useEffect, useState } from 'react';

import { sceneGraph } from '../../core/sceneGraph';

import { type PanelNaturalHeightConstraints } from './panelNaturalHeight';
import { VizPanel } from './VizPanel';

export interface UseVizPanelNaturalHeightOptions {
  enabled: boolean;
  minHeight: number;
  maxHeight: number;
  /** Container whose `clientWidth` drives measurement. Required unless `width` is set. */
  containerRef?: RefObject<HTMLElement | null>;
  /** Fixed width (px). When set, skips observing `containerRef` for width changes. */
  width?: number;
  /** Re-measure on viewport resize when max height depends on `window.innerHeight`. */
  watchViewportResize?: boolean;
}

function resolveWidth(
  containerRef: RefObject<HTMLElement | null> | undefined,
  fixedWidth: number | undefined
): number | undefined {
  if (fixedWidth != null) {
    return fixedWidth;
  }
  const w = containerRef?.current?.clientWidth;
  return w && w > 0 ? w : undefined;
}

/**
 * Tracks {@link VizPanel.getNaturalHeight} for a panel, re-running when width,
 * data, options, or constraints change.
 */
export function useVizPanelNaturalHeight(
  panel: VizPanel,
  options: UseVizPanelNaturalHeightOptions
): number | undefined {
  const { enabled, containerRef, width: fixedWidth, minHeight, maxHeight, watchViewportResize } = options;
  const [height, setHeight] = useState<number | undefined>();

  useEffect(() => {
    if (!enabled) {
      setHeight(undefined);
      return;
    }

    let raf: number | null = null;

    const recompute = () => {
      raf = null;
      const width = resolveWidth(containerRef, fixedWidth);
      if (width == null) {
        return;
      }

      const constraints: PanelNaturalHeightConstraints = { width, minHeight, maxHeight };
      const target = panel.getNaturalHeight(constraints);
      setHeight((prev) => (prev === target ? prev : target));
    };

    const schedule = () => {
      if (raf == null) {
        raf = requestAnimationFrame(recompute);
      }
    };

    schedule();

    const container = fixedWidth == null ? containerRef?.current : null;
    const ro = container ? new ResizeObserver(schedule) : null;
    if (ro && container) {
      ro.observe(container);
    }

    const dataObject = sceneGraph.getData(panel);
    const panelSub = panel.subscribeToState(schedule);
    const dataSub = dataObject.subscribeToState(schedule);

    const onWindowResize = watchViewportResize ? schedule : undefined;
    if (onWindowResize) {
      window.addEventListener('resize', onWindowResize);
    }

    return () => {
      ro?.disconnect();
      panelSub.unsubscribe();
      dataSub.unsubscribe();
      if (onWindowResize) {
        window.removeEventListener('resize', onWindowResize);
      }
      if (raf != null) {
        cancelAnimationFrame(raf);
      }
    };
  }, [enabled, panel, containerRef, fixedWidth, minHeight, maxHeight, watchViewportResize]);

  return enabled ? height : undefined;
}
