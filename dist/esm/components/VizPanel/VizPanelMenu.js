import React, { useEffect } from 'react';
import { Menu } from '@grafana/ui';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { selectors } from '@grafana/e2e-selectors';

class VizPanelMenu extends SceneObjectBase {
  addItem(item) {
    this.setState({
      items: this.state.items ? [...this.state.items, item] : [item]
    });
  }
  setItems(items) {
    this.setState({
      items
    });
  }
}
VizPanelMenu.Component = VizPanelMenuRenderer;
function VizPanelMenuRenderer({ model }) {
  const { items = [] } = model.useState();
  const ref = React.useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);
  const renderItems = (items2) => {
    return items2.map((item) => {
      switch (item.type) {
        case "divider":
          return /* @__PURE__ */ React.createElement(Menu.Divider, {
            key: item.text
          });
        case "group":
          return /* @__PURE__ */ React.createElement(Menu.Group, {
            key: item.text,
            label: item.text
          }, item.subMenu ? renderItems(item.subMenu) : void 0);
        default:
          return /* @__PURE__ */ React.createElement(Menu.Item, {
            key: item.text,
            label: item.text,
            icon: item.iconClassName,
            childItems: item.subMenu ? renderItems(item.subMenu) : void 0,
            url: item.href,
            onClick: item.onClick,
            shortcut: item.shortcut,
            testId: selectors.components.Panels.Panel.menuItems(item.text)
          });
      }
    });
  };
  return /* @__PURE__ */ React.createElement(Menu, {
    ref
  }, renderItems(items));
}

export { VizPanelMenu };
//# sourceMappingURL=VizPanelMenu.js.map
