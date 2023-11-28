import React, { useEffect } from 'react';
import { PanelMenuItem } from '@grafana/data';
import { Menu } from '@grafana/ui';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../../core/types';

interface VizPanelMenuState extends SceneObjectState {
  items?: PanelMenuItem[];
}

export class VizPanelMenu extends SceneObjectBase<VizPanelMenuState> {
  static Component = VizPanelMenuRenderer;

  // Allows adding menu items dynamically
  public addItem(item: PanelMenuItem) {
    this.setState({
      items: this.state.items ? [...this.state.items, item] : [item],
    });
  }

  // Allows replacing all menu items
  public setItems(items: PanelMenuItem[]) {
    this.setState({
      items,
    });
  }
}

function VizPanelMenuRenderer({ model }: SceneComponentProps<VizPanelMenu>) {
  const { items = [] } = model.useState();
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  const renderItems = (items: PanelMenuItem[]) => {
    return items.map((item) =>
      item.type === 'divider' ? (
        <Menu.Divider key={item.text} />
      ) : (
        <Menu.Item
          key={item.text}
          label={item.text}
          icon={item.iconClassName}
          childItems={item.subMenu ? renderItems(item.subMenu) : undefined}
          url={item.href}
          onClick={item.onClick}
          shortcut={item.shortcut}
        />
      )
    );
  };

  return <Menu ref={ref}>{renderItems(items)}</Menu>;
}
