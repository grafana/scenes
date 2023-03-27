import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneLayoutItem } from '../../core/types';

export interface SceneGridItemPlacement {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type SceneGridItemStateLike = SceneLayoutItem &
  SceneGridItemPlacement & {
    isResizable: boolean;
    isDraggable: boolean;
  };

export interface SceneGridItemLike extends SceneObjectBase<SceneGridItemStateLike> {}
