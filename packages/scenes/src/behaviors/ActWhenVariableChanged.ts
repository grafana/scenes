import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { SceneVariable } from '../variables/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

interface ActWhenVariableChangedState extends SceneObjectState {
  // The name of the variable to subscribe to changes to.
  variableName: string;
  // The handler to run when a variable changes. Return a cancellation function if you do anything async like issue a query.
  onChange: (variable: SceneVariable) => (() => void) | void;
}

/**
 * This behavior will run an effect function when specified variables change
 */

export class ActWhenVariableChanged extends SceneObjectBase<ActWhenVariableChangedState> {
  private _runningEffect: null | (() => void) = null;

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: [this.state.variableName],
    onVariableUpdatesCompleted: this._onVariableChanged.bind(this),
  });

  private _onVariableChanged(changedVariables: Set<SceneVariable>): void {
    const effect = this.state.onChange;

    for (const variable of changedVariables) {
      if (this.state.variableName === variable.state.name) {
        if (this._runningEffect) {
          this._runningEffect();
          this._runningEffect = null;
        }

        const cancellation = effect(variable);
        if (cancellation) {
          this._runningEffect = cancellation;
        }
      }
    }
  }
}
