import { SceneObject, SceneObjectStatePlain } from '../../../core/types';

export interface SceneGridItemPlacement {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SceneGridItemStateLike extends SceneGridItemPlacement, SceneObjectStatePlain {
  isResizable: boolean;
  isDraggable: boolean;
}

export type SceneGridItemLike = SceneObject<SceneGridItemStateLike>;
