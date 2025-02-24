import { PointerEvent } from 'react';
import { SceneObject, SceneObjectState } from '../../../core/types';
import { BusEventWithPayload } from '@grafana/data';
import { VizPanel } from '../../VizPanel/VizPanel';

export interface SceneGridItemPlacement {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SceneGridItemStateLike extends SceneGridItemPlacement, SceneObjectState {
  isResizable?: boolean;
  isDraggable?: boolean;
}

export interface SceneGridItemLike extends SceneObject<SceneGridItemStateLike> {
  /**
   * Provide a custom CSS class name for the underlying DOM element when special styling (i.e. for mobile breakpoint) is required.
   **/
  getClassName?(): string;
}

export class SceneGridLayoutDragStartEvent extends BusEventWithPayload<{ evt: PointerEvent; panel: VizPanel }> {
  public static readonly type = 'scene-grid-layout-drag-start';
}
