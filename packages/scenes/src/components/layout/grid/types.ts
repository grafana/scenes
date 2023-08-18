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

export interface SceneGridItemExtraProps {
  isDraggable?: boolean;
}

export type SceneGridItemLike = SceneObject<SceneGridItemStateLike, SceneGridItemExtraProps>;
