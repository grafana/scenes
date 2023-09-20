import { rangeUtil } from '@grafana/data';
import { sceneGraph, SceneObjectState, SceneTimeRangeState } from '@grafana/scenes';
import { HiddenLayoutItemBehavior } from './HiddenLayoutItemBehavior';

export interface BreakdownBehaviorState extends SceneObjectState {
  test: string;
}

/**
 * Just a proof of concept example of a behavior
 */
export class BreakdownBehavior extends HiddenLayoutItemBehavior<BreakdownBehaviorState> {
  public constructor(state: BreakdownBehaviorState) {
    super(state);

    this.addActivationHandler(() => {});
  }
}
