import React from 'react';
import { SceneObjectBase } from '../../../core/SceneObjectBase.js';
import { SceneGridLayout } from './SceneGridLayout.js';
import { SceneGridRow } from './SceneGridRow.js';

class SceneGridItem extends SceneObjectBase {
}
SceneGridItem.Component = SceneGridItemRenderer;
function SceneGridItemRenderer({ model }) {
  const { body } = model.useState();
  const parent = model.parent;
  if (parent && !isSceneGridLayout(parent) && !isSceneGridRow(parent)) {
    throw new Error("SceneGridItem must be a child of SceneGridLayout or SceneGridRow");
  }
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  });
}
function isSceneGridRow(child) {
  return child instanceof SceneGridRow;
}
function isSceneGridLayout(child) {
  return child instanceof SceneGridLayout;
}

export { SceneGridItem, isSceneGridRow };
//# sourceMappingURL=SceneGridItem.js.map
