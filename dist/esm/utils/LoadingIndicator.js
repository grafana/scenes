import { Tooltip, Icon } from '@grafana/ui';
import React from 'react';

function LoadingIndicator(props) {
  return /* @__PURE__ */ React.createElement(Tooltip, {
    content: "Cancel query"
  }, /* @__PURE__ */ React.createElement(Icon, {
    className: "spin-clockwise",
    name: "sync",
    size: "xs",
    role: "button",
    onMouseDown: (e) => {
      props.onCancel(e);
    }
  }));
}

export { LoadingIndicator };
//# sourceMappingURL=LoadingIndicator.js.map
