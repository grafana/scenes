import { sceneGraph } from '../core/sceneGraph';
import { SceneObject, SceneObjectState } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { VARIABLE_REGEX } from './constants';

import { SceneVariable, SceneVariableDependencyConfigLike, VariableValue } from './types';
import { isVariableValueEqual } from './utils';

interface VariableDependencyConfigOptions<TState extends SceneObjectState> {
  /**
   * State paths to scan / extract variable dependencies from. Leave empty to scan all paths.
   */
  statePaths?: Array<keyof TState>;
  /**
   * Optional way to customize how to handle when a dependent variable changes
   * If not specified the default behavior is to trigger a re-render
   */
  onReferencedVariableValueChanged?: () => void;

  /**
   * Optional way to customize how to handle when the variable system has completed an update
   */
  onVariableUpdatesCompleted?: (changedVariables: Set<SceneVariable>) => void;
}

export class VariableDependencyConfig<TState extends SceneObjectState> implements SceneVariableDependencyConfigLike {
  private _state: TState | undefined;
  private _dependencies = new Set<string>();
  private _statePaths?: Array<keyof TState>;
  private _onReferencedVariableValueChanged: () => void;
  private _valuesWhenDeactivated: Map<SceneVariable, VariableValue | undefined | null> | undefined;

  public scanCount = 0;

  public constructor(
    private _sceneObject: SceneObject<TState>,
    private _options: VariableDependencyConfigOptions<TState>
  ) {
    this._statePaths = _options.statePaths;
    this._onReferencedVariableValueChanged =
      _options.onReferencedVariableValueChanged ?? this.defaultHandlerReferencedVariableValueChanged;
  }

  /**
   * Used to check for dependency on a specific variable
   */
  public hasDependencyOn(name: string): boolean {
    return this.getNames().has(name);
  }

  /**
   * This is called whenever any set of variables have new values. It up to this implementation to check if it's relevant given the current dependencies.
   */
  public variableUpdatesCompleted(variables: Set<SceneVariable>) {
    // If custom handler let the scene object handle this
    if (this._options.onVariableUpdatesCompleted) {
      this._options.onVariableUpdatesCompleted(variables);
      return;
    }

    const deps = this.getNames();

    for (const variable of variables) {
      if (deps.has(variable.state.name)) {
        this._onReferencedVariableValueChanged();
        return;
      }
    }
  }

  /**
   * Only way to force a re-render is to update state right now
   */
  private defaultHandlerReferencedVariableValueChanged = () => {
    this._sceneObject.forceRender();
  };

  public getNames(): Set<string> {
    const prevState = this._state;
    const newState = (this._state = this._sceneObject.state);

    if (!prevState) {
      // First time we always scan for dependencies
      this.scanStateForDependencies(this._state);
      return this._dependencies;
    }

    // Second time we only scan if state is a different and if any specific state path has changed
    if (newState !== prevState) {
      if (this._statePaths) {
        for (const path of this._statePaths) {
          if (newState[path] !== prevState[path]) {
            this.scanStateForDependencies(newState);
            break;
          }
        }
      } else {
        this.scanStateForDependencies(newState);
      }
    }

    return this._dependencies;
  }

  private scanStateForDependencies(state: TState) {
    this._dependencies.clear();
    this.scanCount += 1;

    if (this._statePaths) {
      for (const path of this._statePaths) {
        const value = state[path];
        if (value) {
          this.extractVariablesFrom(value);
        }
      }
    } else {
      this.extractVariablesFrom(state);
    }
  }

  private extractVariablesFrom(value: unknown) {
    VARIABLE_REGEX.lastIndex = 0;

    const stringToCheck = typeof value !== 'string' ? safeStringifyValue(value) : value;

    const matches = stringToCheck.matchAll(VARIABLE_REGEX);
    if (!matches) {
      return;
    }

    for (const match of matches) {
      const [, var1, var2, , var3] = match;
      const variableName = var1 || var2 || var3;
      this._dependencies.add(variableName);
    }
  }

  public rememberValuesWhenDeactivated() {
    this._valuesWhenDeactivated = new Map();
    for (const variableName of this.getNames()) {
      const variable = sceneGraph.getVariable(variableName, this._sceneObject);
      if (variable) {
        this._valuesWhenDeactivated.set(variable, variable.getValue());
      }
    }
  }

  public hasVariablesChangedWhileInactive(): boolean {
    if (!this._valuesWhenDeactivated) {
      return false;
    }

    for (const variableName of this.getNames()) {
      const variable = sceneGraph.getVariable(variableName, this._sceneObject);
      if (variable && this._valuesWhenDeactivated.has(variable)) {
        const value = this._valuesWhenDeactivated.get(variable);
        if (!isVariableValueEqual(value, variable.getValue())) {
          return true;
        }
      }
    }

    return false;
  }
}

const safeStringifyValue = (value: unknown) => {
  try {
    return JSON.stringify(value, null);
  } catch (error) {
    console.error(error);
  }

  return '';
};
