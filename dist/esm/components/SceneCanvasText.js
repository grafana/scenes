import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig.js';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

class SceneCanvasText extends SceneObjectBase {
  constructor() {
    super(...arguments);
    this._variableDependency = new VariableDependencyConfig(this, { statePaths: ["text"] });
  }
}
SceneCanvasText.Component = ({ model }) => {
  const { text, fontSize = 20, align = "left", key, spacing } = model.useState();
  const theme = useTheme2();
  const style = css({
    fontSize,
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    padding: spacing ? theme.spacing(spacing, 0) : void 0,
    justifyContent: align
  });
  return /* @__PURE__ */ React.createElement("div", {
    className: style,
    "data-testid": key
  }, sceneGraph.interpolate(model, text));
};

export { SceneCanvasText };
//# sourceMappingURL=SceneCanvasText.js.map
