import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';

class SceneControlsSpacer extends SceneObjectBase {
  constructor() {
    super({});
    this._renderBeforeActivation = true;
  }
}
SceneControlsSpacer.Component = (_props) => {
  return /* @__PURE__ */ React.createElement("div", {
    style: { flexGrow: 1 }
  });
};

export { SceneControlsSpacer };
//# sourceMappingURL=SceneControlsSpacer.js.map
