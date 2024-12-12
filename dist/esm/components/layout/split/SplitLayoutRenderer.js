import React from 'react';
import { Splitter } from './Splitter.js';

function SplitLayoutRenderer({ model }) {
  const { primary, secondary, direction, isHidden, initialSize, primaryPaneStyles, secondaryPaneStyles } = model.useState();
  if (isHidden) {
    return null;
  }
  const Prim = primary.Component;
  const Sec = secondary == null ? void 0 : secondary.Component;
  let startSize = secondary ? initialSize : 1;
  return /* @__PURE__ */ React.createElement(Splitter, {
    direction,
    initialSize: startSize != null ? startSize : 0.5,
    primaryPaneStyles,
    secondaryPaneStyles
  }, /* @__PURE__ */ React.createElement(Prim, {
    key: primary.state.key,
    model: primary,
    parentState: model.state
  }), Sec && secondary && /* @__PURE__ */ React.createElement(Sec, {
    key: secondary.state.key,
    model: secondary,
    parentState: model.state
  }));
}

export { SplitLayoutRenderer };
//# sourceMappingURL=SplitLayoutRenderer.js.map
