import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps } from '../../../core/types';
import { SceneGridItemStateLike, SceneGridItemLike } from './types';
import { isSceneGridLayout, isSceneGridRow } from './SceneGridItem';

interface SceneGridPlaceholderItemState extends SceneGridItemStateLike {}

export class SceneGridPlaceholderItem
  extends SceneObjectBase<SceneGridPlaceholderItemState>
  implements SceneGridItemLike
{
  static Component = SceneGridPlaceholderItemRenderer;

  public constructor() {
    super({
      x: 1,
      y: 1,
      width: 12,
      height: 6,
    });
  }
}

function SceneGridPlaceholderItemRenderer({ model }: SceneComponentProps<SceneGridPlaceholderItem>) {
  const parent = model.parent;

  if (parent && !isSceneGridLayout(parent) && !isSceneGridRow(parent)) {
    throw new Error('SceneGridPlaceholderItem must be a child of SceneGridLayout or SceneGridRow');
  }

  return null;
}
