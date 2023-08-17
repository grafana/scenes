import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneObject, SceneLayoutChildComponentProps } from '../../../core/types';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridRow } from './SceneGridRow';
import { SceneGridItemStateLike, SceneGridItemLike } from './types';
import { renderSceneComponentWithExtraProps } from '../../../utils/renderWithExtraProps';

interface SceneGridItemState extends SceneGridItemStateLike {
  body: SceneObject | undefined;
}
export class SceneGridItem extends SceneObjectBase<SceneGridItemState> implements SceneGridItemLike {
  static Component = SceneGridItemRenderer;
}

function SceneGridItemRenderer({
  model,
  isDraggable,
  dragClass,
  dragClassCancel,
}: SceneLayoutChildComponentProps<SceneGridItem>) {
  const { body, isDraggable: localIsDraggable } = model.useState();
  const parent = model.parent;

  if (parent && !isSceneGridLayout(parent) && !isSceneGridRow(parent)) {
    throw new Error('SceneGridItem must be a child of SceneGridLayout or SceneGridRow');
  }

  if (!body) {
    return null;
  }

  return renderSceneComponentWithExtraProps(body, {
    isDraggable: isDraggable && (localIsDraggable ?? true),
    dragClass,
    dragClassCancel,
  });
}

export function isSceneGridRow(child: SceneObject): child is SceneGridRow {
  return child instanceof SceneGridRow;
}

function isSceneGridLayout(child: SceneObject): child is SceneGridLayout {
  return child instanceof SceneGridLayout;
}
