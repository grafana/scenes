import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { SceneVariable } from '../variables/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

interface ActWhenVariableChangedState extends SceneObjectState {
  // The name of the variable to subscribe to changes to.
  variableName: string;
  /**
   * The handler to run when a variable changes.
   * @param variable The variable that changed
   * @param behavior The behavior instance where this onChange handler added to.
   *  You can use this to access the parent SceneObject where this behavior exists.
   *  You can also use this with the sceneGraph util functions to find objects from this scene graph location.
   * @returns Return a cancellation function if you do anything async like issue a query.
   */
  onChange: (variable: SceneVariable, behavior: ActWhenVariableChanged) => (() => void) | void;
}

/**
 * This behavior will run an effect function when specified variables change
 */

export class ActWhenVariableChanged extends SceneObjectBase<ActWhenVariableChangedState> {
  private _runningEffect: null | (() => void) = null;

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: [this.state.variableName],
    onReferencedVariableValueChanged: this._onVariableChanged.bind(this),
  });

  private _onVariableChanged(variable: SceneVariable): void {
    const effect = this.state.onChange;

    if (this._runningEffect) {
      this._runningEffect();
      this._runningEffect = null;
    }

    const cancellation = effect(variable, this);
    if (cancellation) {
      this._runningEffect = cancellation;
    }
  }
}
