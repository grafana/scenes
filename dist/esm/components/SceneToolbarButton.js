import React from 'react';
import { ToolbarButton, Input } from '@grafana/ui';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { ControlsLabel } from '../utils/ControlsLabel.js';

class SceneToolbarButton extends SceneObjectBase {
}
SceneToolbarButton.Component = ({ model }) => {
  const state = model.useState();
  return /* @__PURE__ */ React.createElement(ToolbarButton, {
    onClick: state.onClick,
    icon: state.icon
  });
};
class SceneToolbarInput extends SceneObjectBase {
}
SceneToolbarInput.Component = ({ model }) => {
  const state = model.useState();
  return /* @__PURE__ */ React.createElement("div", {
    style: { display: "flex" }
  }, state.label && /* @__PURE__ */ React.createElement(ControlsLabel, {
    label: state.label
  }), /* @__PURE__ */ React.createElement(Input, {
    defaultValue: state.value,
    width: 8,
    onBlur: (evt) => {
      model.state.onChange(parseInt(evt.currentTarget.value, 10));
    }
  }));
};

export { SceneToolbarButton, SceneToolbarInput };
//# sourceMappingURL=SceneToolbarButton.js.map
