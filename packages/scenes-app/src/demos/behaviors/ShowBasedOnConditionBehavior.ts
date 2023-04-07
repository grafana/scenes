import { SceneObject, SceneObjectState } from '@grafana/scenes';
import { HiddenLayoutItemBehavior } from './HiddenLayoutItemBehavior';

export interface ShowBasedOnConditionBehaviorState extends SceneObjectState {
  getCondition: () => ShowBasedCondition;
}

export interface ShowBasedCondition {
  references: SceneObject[];
  condition: () => boolean;
}

export class ShowBasedOnConditionBehavior extends HiddenLayoutItemBehavior<ShowBasedOnConditionBehaviorState> {
  private _condition: ShowBasedCondition | undefined;

  public constructor(state: ShowBasedOnConditionBehaviorState) {
    super(state);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    this._condition = this.state.getCondition();

    for (const ref of this._condition.references) {
      this._subs.add(ref.subscribeToState(() => this._onReferenceChanged()));
    }

    this._onReferenceChanged();
  }

  private _onReferenceChanged() {
    if (this._condition!.condition()) {
      this.setVisible();
    } else {
      this.setHidden();
    }
  }
}
