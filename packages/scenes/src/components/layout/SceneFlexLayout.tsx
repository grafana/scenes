import React, { CSSProperties } from 'react';

import { Field, RadioButtonGroup } from '@grafana/ui';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayout, SceneObjectStatePlain, SceneLayoutState } from '../../core/types';

interface SceneFlexLayoutState extends SceneObjectStatePlain {
  direction?: CSSProperties['flexDirection'];
  wrap?: CSSProperties['flexWrap'];
  children: SceneFlexItem[];
}

interface SceneFlexItemState extends SceneLayoutState {
  order?: CSSProperties['order'];
  flexGrow?: CSSProperties['flexGrow'];
  flexShrink?: CSSProperties['flexShrink'];
  flexBasis?: CSSProperties['flexBasis'];
  alignSelf?: CSSProperties['alignSelf'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minWidth?: CSSProperties['minWidth'];
  minHeight?: CSSProperties['minHeight'];
  maxWidth?: CSSProperties['maxWidth'];
  maxHeight?: CSSProperties['maxHeight'];
  isDraggable?: boolean;
  isResizable?: boolean;
}

export class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
  public static Component = SceneFlexItemRenderer;
}

function SceneFlexItemRenderer({ model }: SceneComponentProps<SceneFlexItem>) {
  const { children, ...rest } = model.useState();
  const style: CSSProperties = {
    display: 'flex',
    position: 'relative',
    flexGrow: rest.flexGrow || 0, // 0 = default?
    flexShrink: rest.flexShrink, // 1 = default?
    alignSelf: rest.alignSelf || 'auto',
    flexBasis: rest.flexBasis || 'auto',
    width: rest.width || 'auto',
    height: rest.height || 'auto',
    minWidth: rest.minWidth || 0,
    minHeight: rest.minHeight || 0,
    maxWidth: rest.maxWidth,
    maxHeight: rest.maxHeight,
  };

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
