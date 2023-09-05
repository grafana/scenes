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
   * Provide a custom CSS class name for the underlying DOM element when special styling (i.e. for mobile breakpoint) is required.
   **/
  getClassName?(): string;
}
