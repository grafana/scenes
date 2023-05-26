import {
  SceneObjectBase,
  SceneObjectState,
  SceneVariable,
  SceneVariableState,
  VariableDependencyConfig,
} from '@grafana/scenes';

interface VariableEffectBehaviorState extends SceneObjectState {
  // The names of the variables to effect when they change
  variables: string[];
  // The effect to run when a variable changes. Optionally return a cancel function
  effect: (variableState: SceneVariableState) => (() => void) | void;
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
