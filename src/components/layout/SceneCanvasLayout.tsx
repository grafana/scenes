import React from 'react';
import { VerticalConstraint, HorizontalConstraint, BackgroundImageSize } from '../../core/canvasTypes';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayoutState,
  SceneLayoutChildOptions,
  SceneLayout,
  SceneLayoutChildState,
} from '../../core/types';

interface SceneCanvasLayoutState extends SceneLayoutState {}

export class SceneCanvasLayout extends SceneObjectBase<SceneCanvasLayoutState> implements SceneLayout {
  public static Component = CanvasLayoutRenderer;
  public static Editor = CanvasLayoutEditor;

  public isDraggable(): boolean {
    return false;
  }
}

function CanvasLayoutRenderer({ model, isEditing }: SceneComponentProps<SceneCanvasLayout>) {
  const { children } = model.useState();

  return (
    <>
      {children.map((item) => {
        return (
          <div 
            style={getItemStyles(item.state)} 
            key={item.state.key} 
            className="selectable" 
            ref={(v) => {
              // not pretty, but this lets us get back to the item directly
              // from dom events -- avoiding a complicated lookup by key
              if(v) {
                (v as any).__item = item; 
              }
            }}>
            <item.Component model={item} isEditing={isEditing} />
          </div>
        );
      })}
    </>
  );
}

export function getItemStyles(state: SceneLayoutChildState = {}) {
  const { constraint } = state;
  const { vertical, horizontal } = constraint ?? {};
  const placement = state.placement ?? ({} as SceneLayoutChildOptions);

  const editingEnabled = false;
  const disablePointerEvents = false;

  const style: React.CSSProperties = {
    cursor: editingEnabled ? 'grab' : 'auto',
    pointerEvents: disablePointerEvents ? 'none' : 'auto',
    position: 'absolute',
    // Minimum element size is 10x10
    minWidth: '10px',
    minHeight: '10px',
  };

  const translate = ['0px', '0px'];

  switch (vertical) {
    case VerticalConstraint.Top:
      placement.top = placement.top ?? 0;
      placement.height = placement.height ?? 100;
      style.top = `${placement.top}px`;
      style.height = `${placement.height}px`;
      delete placement.bottom;
      break;
    case VerticalConstraint.Bottom:
      placement.bottom = placement.bottom ?? 0;
      placement.height = placement.height ?? 100;
      style.bottom = `${placement.bottom}px`;
      style.height = `${placement.height}px`;
      delete placement.top;
      break;
    case VerticalConstraint.TopBottom:
      placement.top = placement.top ?? 0;
      placement.bottom = placement.bottom ?? 0;
      style.top = `${placement.top}px`;
      style.bottom = `${placement.bottom}px`;
      delete placement.height;
      style.height = '';
      break;
    case VerticalConstraint.Center:
      placement.top = placement.top ?? 0;
      placement.height = placement.height ?? 100;
      translate[1] = '-50%';
      style.top = `calc(50% - ${placement.top}px)`;
      style.height = `${placement.height}px`;
      delete placement.bottom;
      break;
    case VerticalConstraint.Scale:
      placement.top = placement.top ?? 0;
      placement.bottom = placement.bottom ?? 0;
      style.top = `${placement.top}%`;
      style.bottom = `${placement.bottom}%`;
      delete placement.height;
      style.height = '';
      break;
  }

  switch (horizontal) {
    case HorizontalConstraint.Left:
      placement.left = placement.left ?? 0;
      placement.width = placement.width ?? 100;
      style.left = `${placement.left}px`;
      style.width = `${placement.width}px`;
      delete placement.right;
      break;
    case HorizontalConstraint.Right:
      placement.right = placement.right ?? 0;
      placement.width = placement.width ?? 100;
      style.right = `${placement.right}px`;
      style.width = `${placement.width}px`;
      delete placement.left;
      break;
    case HorizontalConstraint.LeftRight:
      placement.left = placement.left ?? 0;
      placement.right = placement.right ?? 0;
      style.left = `${placement.left}px`;
      style.right = `${placement.right}px`;
      delete placement.width;
      style.width = '';
      break;
    case HorizontalConstraint.Center:
      placement.left = placement.left ?? 0;
      placement.width = placement.width ?? 100;
      translate[0] = '-50%';
      style.left = `calc(50% - ${placement.left}px)`;
      style.width = `${placement.width}px`;
      delete placement.right;
      break;
    case HorizontalConstraint.Scale:
      placement.left = placement.left ?? 0;
      placement.right = placement.right ?? 0;
      style.left = `${placement.left}%`;
      style.right = `${placement.right}%`;
      delete placement.width;
      style.width = '';
      break;
  }

  style.transform = `translate(${translate[0]}, ${translate[1]})`;

  const { background, border } = state;
  if (background) {
    if (background.color) {
      //TODO make data driven
      style.backgroundColor = background.color;
    }
    if (background.image) {
      const image = background.image;
      if (image) {
        const v = image;
        if (v) {
          style.backgroundImage = `url("${v}")`;
          switch (background.size ?? BackgroundImageSize.Contain) {
            case BackgroundImageSize.Contain:
              style.backgroundSize = 'contain';
              style.backgroundRepeat = 'no-repeat';
              break;
            case BackgroundImageSize.Cover:
              style.backgroundSize = 'cover';
              style.backgroundRepeat = 'no-repeat';
              break;
            case BackgroundImageSize.Original:
              style.backgroundRepeat = 'no-repeat';
              break;
            case BackgroundImageSize.Tile:
              style.backgroundRepeat = 'repeat';
              break;
            case BackgroundImageSize.Fill:
              style.backgroundSize = '100% 100%';
              break;
          }
        } else {
          style.backgroundImage = '';
        }
      }
    }
  }

  if (border && border.color && border.width !== undefined) {
    const color = border.color;
    style.borderWidth = `${border.width}px`;
    style.borderStyle = 'solid';
    style.borderColor = color;

    // Move the image to inside the border
    if (style.backgroundImage) {
      style.backgroundOrigin = 'padding-box';
    }
  }

  if (placement && placement.minWidth !== undefined) {
    style.minWidth = placement.minWidth;
  }

  if (placement && placement.minHeight !== undefined) {
    style.minHeight = placement.minHeight;
  }

  // this.options.placement = placement;
  // this.sizeStyle = style;
  // if (this.div) {
  //   for (const key in this.sizeStyle) {
  //     this.div.style[key as any] = (this.sizeStyle as any)[key];
  //   }

  //   for (const key in this.dataStyle) {
  //     this.div.style[key as any] = (this.dataStyle as any)[key];
  //   }
  // }

  return style;
}

// @TODO implement
function CanvasLayoutEditor({ model }: SceneComponentProps<SceneCanvasLayout>) {
  return <div>EDITOR</div>;
}
