import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneObject, SceneComponentProps } from '../../../core/types';
import { SceneGridLayout } from './SceneGridLayout';
import { SceneGridRow } from './SceneGridRow';
import { SceneGridItemStateLike, SceneGridItemLike } from './types';

interface SceneGridItemState extends SceneGridItemStateLike {
  body: SceneObject | undefined;
}
export class SceneGridItem extends SceneObjectBase<SceneGridItemState> implements SceneGridItemLike {
  static Component = SceneGridItemRenderer;
}

function SceneGridItemRenderer({ model }: SceneComponentProps<SceneGridItem>) {
  const { body } = model.useState();
  const parent = model.parent;

  if (parent && !isSceneGridLayout(parent) && !isSceneGridRow(parent)) {
    throw new Error('SceneGridItem must be a child of SceneGridLayout or SceneGridRow');
  }

  if (!body) {
    return null;
  }

  return <body.Component model={body} />;
}

export function isSceneGridRow(child: SceneObject): child is SceneGridRow {
  return child instanceof SceneGridRow;
}

function isSceneGridLayout(child: SceneObject): child is SceneGridLayout {
  return child instanceof SceneGridLayout;
}
