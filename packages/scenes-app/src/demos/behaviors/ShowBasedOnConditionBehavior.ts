import { sceneGraph, SceneObject, SceneObjectState } from '@grafana/scenes';
import { HiddenLayoutItemBehavior } from './HiddenLayoutItemBehavior';

export interface ShowBasedOnConditionBehaviorState extends SceneObjectState {
  references: string[];
  condition: (...args: any[]) => boolean;
}

export interface ShowBasedCondition {
  references: SceneObject[];
  condition: () => boolean;
}

export class ShowBasedOnConditionBehavior extends HiddenLayoutItemBehavior<ShowBasedOnConditionBehaviorState> {
  private _resolvedRefs: SceneObject[] = [];

  public constructor(state: ShowBasedOnConditionBehaviorState) {
    super(state);

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    // Subscribe to references
    for (const objectKey of this.state.references) {
      const solvedRef = sceneGraph.findObject(this, (obj) => obj.state.key === objectKey);
      if (!solvedRef) {
        throw new Error(`SceneObject with key ${objectKey} not found in scene graph`);
      }

      this._resolvedRefs.push(solvedRef);
      this._subs.add(solvedRef.subscribeToState(() => this._onReferenceChanged()));
    }

    this._onReferenceChanged();
  }

  private _onReferenceChanged() {
    if (this.state.condition(...this._resolvedRefs)) {
      this.setVisible();
    } else {
      this.setHidden();
    }
  }
}
