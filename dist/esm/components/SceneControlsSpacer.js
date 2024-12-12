import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';

const _SceneControlsSpacer = class extends SceneObjectBase {
  constructor() {
    super({});
  }
  get Component() {
    return _SceneControlsSpacer.Component;
  }
};
let SceneControlsSpacer = _SceneControlsSpacer;
SceneControlsSpacer.Component = (_props) => {
  return /* @__PURE__ */ React.createElement("div", {
    style: { flexGrow: 1 }
  });
};

export { SceneControlsSpacer };
//# sourceMappingURL=SceneControlsSpacer.js.map
