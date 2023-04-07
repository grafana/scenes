import { rangeUtil } from '@grafana/data';
import { sceneGraph, SceneObjectState, SceneTimeRangeState } from '@grafana/scenes';
import { HiddenLayoutItemBehavior } from './HiddenLayoutItemBehavior';

export interface HiddenForTimeRangeBehaviorState extends SceneObjectState {
  greaterThan: string;
}

/**
 * Just a proof of concept example of a behavior
 */
export class HiddenForTimeRangeBehavior extends HiddenLayoutItemBehavior<HiddenForTimeRangeBehaviorState> {
  public constructor(state: HiddenForTimeRangeBehaviorState) {
    super(state);

    this.addActivationHandler(() => {
      this._subs.add(sceneGraph.getTimeRange(this).subscribeToState(this._onTimeRangeChange));
      this._onTimeRangeChange(sceneGraph.getTimeRange(this).state);
    });
  }

  private _onTimeRangeChange = (state: SceneTimeRangeState) => {
    const range = rangeUtil.convertRawToRange({ from: this.state.greaterThan, to: 'now' });

    if (state.value.from.valueOf() < range.from.valueOf()) {
      this.setHidden();
    } else {
      this.setVisible();
    }
  };
}
