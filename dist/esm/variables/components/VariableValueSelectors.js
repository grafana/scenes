import React from 'react';
import { VariableHide } from '@grafana/data';
import { SceneObjectBase, useSceneObjectState } from '../../core/SceneObjectBase.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { ControlsLabel } from '../../utils/ControlsLabel.js';
import { css } from '@emotion/css';
import { selectors } from '@grafana/e2e-selectors';

class VariableValueSelectors extends SceneObjectBase {
}
VariableValueSelectors.Component = VariableValueSelectorsRenderer;
function VariableValueSelectorsRenderer({ model }) {
  const variables = sceneGraph.getVariables(model).useState();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, variables.variables.map((variable) => /* @__PURE__ */ React.createElement(VariableValueSelectWrapper, {
    key: variable.state.key,
    variable,
    layout: model.state.layout
  })));
}
function VariableValueSelectWrapper({ variable, layout, showAlways, hideLabel }) {
  const state = useSceneObjectState(variable, { shouldActivateOrKeepAlive: true });
  if (state.hide === VariableHide.hideVariable && !showAlways) {
    return null;
  }
  if (layout === "vertical") {
    return /* @__PURE__ */ React.createElement("div", {
      className: verticalContainer,
      "data-testid": selectors.pages.Dashboard.SubMenu.submenuItem
    }, /* @__PURE__ */ React.createElement(VariableLabel, {
      variable,
      layout,
      hideLabel
    }), /* @__PURE__ */ React.createElement(variable.Component, {
      model: variable
    }));
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: containerStyle,
    "data-testid": selectors.pages.Dashboard.SubMenu.submenuItem
  }, /* @__PURE__ */ React.createElement(VariableLabel, {
    variable,
    hideLabel
  }), /* @__PURE__ */ React.createElement(variable.Component, {
    model: variable
  }));
}
function VariableLabel({ variable, layout, hideLabel }) {
  var _a, _b;
  const { state } = variable;
  if (variable.state.hide === VariableHide.hideLabel || hideLabel) {
    return null;
  }
  const elementId = `var-${state.key}`;
  const labelOrName = (_a = state.label) != null ? _a : state.name;
  return /* @__PURE__ */ React.createElement(ControlsLabel, {
    htmlFor: elementId,
    isLoading: state.loading,
    onCancel: () => {
      var _a2;
      return (_a2 = variable.onCancel) == null ? void 0 : _a2.call(variable);
    },
    label: labelOrName,
    error: state.error,
    layout,
    description: (_b = state.description) != null ? _b : void 0
  });
}
const containerStyle = css({ display: "flex" });
const verticalContainer = css({ display: "flex", flexDirection: "column" });

export { VariableValueSelectWrapper, VariableValueSelectors };
//# sourceMappingURL=VariableValueSelectors.js.map
