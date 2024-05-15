import { CSSProperties } from 'react';
import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneObjectState } from '../../../core/types';
import { SceneFlexItemPlacement, SceneFlexItemLike } from '../SceneFlexLayout';
import { SplitLayoutRenderer } from './SplitLayoutRenderer';

interface SplitLayoutState extends SceneObjectState, SceneFlexItemPlacement {
  primary: SceneFlexItemLike;
  secondary?: SceneFlexItemLike;
  direction: 'row' | 'column';
  initialSize?: number;
  primaryPaneStyles?: CSSProperties;
  secondaryPaneStyles?: CSSProperties;
}

export class SplitLayout extends SceneObjectBase<SplitLayoutState> {
  public static Component = SplitLayoutRenderer;

  public toggleDirection() {
    this.setState({
      direction: this.state.direction === 'row' ? 'column' : 'row',
    });
  }

  public isDraggable(): boolean {
    return false;
  }
}
