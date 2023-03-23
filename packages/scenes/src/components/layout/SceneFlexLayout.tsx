import React, { CSSProperties } from 'react';

import { Field, RadioButtonGroup } from '@grafana/ui';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayout,
  SceneObjectStatePlain,
  SceneLayoutState,
  SceneObject,
} from '../../core/types';

interface SceneFlexLayoutState extends SceneObjectStatePlain {
  direction?: CSSProperties['flexDirection'];
  wrap?: CSSProperties['flexWrap'];
  children: SceneFlexItem[];
}

interface SceneFlexItemState extends SceneLayoutState {
  flexGrow?: CSSProperties['flexGrow'];
  alignSelf?: CSSProperties['alignSelf'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minWidth?: CSSProperties['minWidth'];
  minHeight?: CSSProperties['minHeight'];
  maxWidth?: CSSProperties['maxWidth'];
  maxHeight?: CSSProperties['maxHeight'];
  xSizing?: 'fill' | 'content';
  ySizing?: 'fill' | 'content';
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function isSceneFlexLayout(model: SceneObject): model is SceneFlexLayout {
  return model instanceof SceneFlexLayout;
}

function SceneFlexItemRenderer({ model }: SceneComponentProps<SceneFlexItem>) {
  const { children } = model.useState();
  const parent = model.parent;
  let style: CSSProperties = {};

  if (parent && isSceneFlexLayout(parent)) {
    style = getItemStyles(parent.state.direction || 'row', model);
  } else {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  return (
    <div style={style}>
      {children.map((item) => (
        <item.Component key={item.state.key} model={item} />
      ))}
    </div>
  );
}
export class SceneFlexLayout extends SceneObjectBase<SceneFlexLayoutState> implements SceneLayout {
  public static Component = FlexLayoutRenderer;
  public static Editor = FlexLayoutEditor;

  public toggleDirection() {
    this.setState({
      direction: this.state.direction === 'row' ? 'column' : 'row',
    });
  }

  public isDraggable(): boolean {
    return false;
  }
}

function FlexLayoutRenderer({ model }: SceneComponentProps<SceneFlexLayout>) {
  const { direction = 'row', children, wrap } = model.useState();
  const style: CSSProperties = {
    display: 'flex',
    flexGrow: 1,
    flexDirection: direction,
    gap: '8px',
    flexWrap: wrap || 'nowrap',
    alignContent: 'baseline',
    minHeight: 0,
  };

  return (
    <div style={style}>
      {children.map((item) => (
        <item.Component key={item.state.key} model={item} />
      ))}
    </div>
  );
}

function FlexLayoutEditor({ model }: SceneComponentProps<SceneFlexLayout>) {
  const { direction = 'row' } = model.useState();
  const options = [
    { icon: 'arrow-right', value: 'row' },
    { icon: 'arrow-down', value: 'column' },
  ];

  return (
    <Field label="Direction">
      <RadioButtonGroup
        options={options}
        value={direction}
        onChange={(value) => model.setState({ direction: value as CSSProperties['flexDirection'] })}
      />
    </Field>
  );
}

function getItemStyles(direction: CSSProperties['flexDirection'], item: SceneFlexItem) {
  const { xSizing = 'fill', ySizing = 'fill' } = item.state;

  const style: CSSProperties = {
    display: 'flex',
    position: 'relative',
    flexDirection: direction,
    minWidth: item.state.minWidth,
    minHeight: item.state.minHeight,
    maxWidth: item.state.maxWidth,
    maxHeight: item.state.maxHeight,
  };

  if (direction === 'column') {
    if (item.state.height) {
      style.height = item.state.height;
    } else {
      style.flexGrow = ySizing === 'fill' ? 1 : 0;
    }

    if (item.state.width) {
      style.width = item.state.width;
    } else {
      style.alignSelf = xSizing === 'fill' ? 'stretch' : 'flex-start';
    }
  } else {
    if (item.state.height) {
      style.height = item.state.height;
    } else {
      style.alignSelf = ySizing === 'fill' ? 'stretch' : 'flex-start';
    }

    if (item.state.width) {
      style.width = item.state.width;
    } else {
      style.flexGrow = xSizing === 'fill' ? 1 : 0;
    }
  }

  return style;
}
