import { SceneObject, SceneObjectState } from '../../../core/types';

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
   * This is needed by PanelRepeaterGridItem to have special css behavior for responsive (mobile) breakpoint.
   **/
  getClassName?(): string;
}
