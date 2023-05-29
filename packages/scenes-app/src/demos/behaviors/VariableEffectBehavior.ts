import {
  SceneObjectBase,
  SceneObjectState,
  SceneVariable,
  SceneVariableState,
  VariableDependencyConfig,
} from '@grafana/scenes';

interface VariableChangedActionBehaviorState extends SceneObjectState {
  // The names of the variable to subscribe to changes to 
  variableName: string;
  // The handler to run when a variable changes. Return a cancellation function if you do anything async like issue a query
  onChange: (variable: SceneVariable) => (() => void) | void;
} 

/**
 * This behavior will run an effect function when specified variables change
 */

export class VariableEffectBehavior extends SceneObjectBase<VariableEffectBehaviorState> {
  private _runningEffects = new Map<string, () => void>();

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: this.state.variables,
    onVariableUpdatesCompleted: this._onVariableChanged.bind(this),
  });

  private _onVariableChanged(changedVariables: Set<SceneVariable>): void {
    const effect = this.state.effect;

    for (const variable of changedVariables) {
      if (this.state.variables.includes(variable.state.name)) {
        if (this._runningEffects.has(variable.state.name)) {
          this._runningEffects.get(variable.state.name)!();
          this._runningEffects.delete(variable.state.name);
        }
        const cancellation = effect(variable.state);
        if (cancellation) {
          this._runningEffects.set(variable.state.name, cancellation);
        }
      }
    }
  }
}
