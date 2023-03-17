import { SceneObject } from 'src/core/types';
import {
  SceneFlexLayout,
  SceneFlexLayoutChild,
  SceneFlexLayoutChildState,
  SceneFlexLayoutState,
} from './SceneFlexLayout';

export class SceneFlexLayoutBuilder {
  private children: SceneFlexLayoutChild[] = [];
  private current: SceneFlexLayoutChild | SceneFlexLayout;

  public constructor(state: Partial<SceneFlexLayoutState>) {
    this.current = new SceneFlexLayout({ children: [], ...state });
  }

  public addRow(state: Partial<SceneFlexLayoutState>) {
    return this;
  }

  public addChild(child: SceneObject, layoutOptions: SceneFlexLayoutChildState) {
    this.children.push(new SceneFlexLayoutChild({ ...layoutOptions, body: child }));
    return this;
  }
}
