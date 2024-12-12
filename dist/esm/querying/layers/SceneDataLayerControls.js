import { css } from '@emotion/css';
import { LoadingState } from '@grafana/schema';
import { InlineSwitch } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { ControlsLabel } from '../../utils/ControlsLabel.js';

class SceneDataLayerControls extends SceneObjectBase {
  constructor() {
    super({});
  }
}
SceneDataLayerControls.Component = SceneDataLayerControlsRenderer;
function SceneDataLayerControlsRenderer({ model }) {
  const layers = sceneGraph.getDataLayers(model, true);
  if (layers.length === 0) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, layers.map((layer) => /* @__PURE__ */ React.createElement(layer.Component, {
    model: layer,
    key: layer.state.key
  })));
}
function DataLayerControlSwitch({ layer }) {
  var _a, _b;
  const elementId = `data-layer-${layer.state.key}`;
  const { data, isEnabled } = layer.useState();
  const showLoading = Boolean(data && data.state === LoadingState.Loading);
  return /* @__PURE__ */ React.createElement("div", {
    className: containerStyle
  }, /* @__PURE__ */ React.createElement(ControlsLabel, {
    htmlFor: elementId,
    isLoading: showLoading,
    onCancel: () => {
      var _a2;
      return (_a2 = layer.cancelQuery) == null ? void 0 : _a2.call(layer);
    },
    label: layer.state.name,
    description: layer.state.description,
    error: (_b = (_a = layer.state.data) == null ? void 0 : _a.errors) == null ? void 0 : _b[0].message
  }), /* @__PURE__ */ React.createElement(InlineSwitch, {
    id: elementId,
    value: isEnabled,
    onChange: () => layer.setState({ isEnabled: !isEnabled })
  }));
}
const containerStyle = css({ display: "flex" });

export { DataLayerControlSwitch, SceneDataLayerControls };
//# sourceMappingURL=SceneDataLayerControls.js.map
