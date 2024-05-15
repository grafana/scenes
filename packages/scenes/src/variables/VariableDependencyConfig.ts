import { DataLinkBuiltInVars } from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObject, SceneObjectState } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { VARIABLE_REGEX } from './constants';

import { SceneVariable, SceneVariableDependencyConfigLike } from './types';
import { safeStringifyValue } from './utils';

interface VariableDependencyConfigOptions<TState extends SceneObjectState> {
  /**
   * State paths to scan / extract variable dependencies from. Leave empty to scan all paths.
   */
  statePaths?: Array<keyof TState | '*'>;

  /**
   * Explicit list of variable names to depend on. Leave empty to scan state for dependencies.
   */
  variableNames?: string[];

  /**
   * Optional way to customize how to handle when a dependent variable changes
   * If not specified the default behavior is to trigger a re-render
   */
  onReferencedVariableValueChanged?: (variable: SceneVariable) => void;

  /**
   * Two scenarios trigger this callback to be called.
   * 1. When any direct dependency changed value
   * 2. In case hasDependencyInLoadingState was called and returned true we really care about any variable update. So in this scenario this callback is called
   *    after any variable update completes. This is to cover scenarios where an object is waiting for indirect dependencies to complete.
   */
  onVariableUpdateCompleted?: () => void;

  /**
   * Optional way to subscribe to all variable value changes, even to variables that are not dependencies.
   */
  onAnyVariableChanged?: (variable: SceneVariable) => void;
}

export class VariableDependencyConfig<TState extends SceneObjectState> implements SceneVariableDependencyConfigLike {
  private _state: TState | undefined;
  private _dependencies = new Set<string>();
  private _statePaths?: Array<keyof TState | '*'>;
  private _isWaitingForVariables = false;

  public scanCount = 0;

  public constructor(
    private _sceneObject: SceneObject<TState>,
    private _options: VariableDependencyConfigOptions<TState>
  ) {
    this._statePaths = _options.statePaths;
  }

  /**
   * Used to check for dependency on a specific variable
   */
  public hasDependencyOn(name: string): boolean {
    return this.getNames().has(name);
  }

  /**
   * This is called whenever any set of variables have new values. It is up to this implementation to check if it's relevant given the current dependencies.
   */
  public variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean) {
    const deps = this.getNames();
    let dependencyChanged = false;

    if ((deps.has(variable.state.name) || deps.has(DataLinkBuiltInVars.includeVars)) && hasChanged) {
      dependencyChanged = true;
    }

    writeSceneLog(
      'VariableDependencyConfig',
      'variableUpdateCompleted',
      variable.state.name,
      dependencyChanged,
      this._isWaitingForVariables
    );

    if (this._options.onAnyVariableChanged) {
      this._options.onAnyVariableChanged(variable);
    }

    // If custom handler called when dependency is changed or when we are waiting for variables
    if (this._options.onVariableUpdateCompleted && (this._isWaitingForVariables || dependencyChanged)) {
      this._options.onVariableUpdateCompleted();
    }

    if (dependencyChanged) {
      if (this._options.onReferencedVariableValueChanged) {
        this._options.onReferencedVariableValueChanged(variable);
      }

      // if no callbacks are specified then just do a forceRender
      if (!this._options.onReferencedVariableValueChanged && !this._options.onVariableUpdateCompleted) {
        this._sceneObject.forceRender();
      }
    }
  }

  public hasDependencyInLoadingState() {
    if (sceneGraph.hasVariableDependencyInLoadingState(this._sceneObject)) {
      this._isWaitingForVariables = true;
      return true;
    }

    this._isWaitingForVariables = false;
    return false;
  }

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
          if (path === '*' || newState[path] !== prevState[path]) {
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

  /**
   * Update variableNames
   */
  public setVariableNames(varNames: string[]) {
    this._options.variableNames = varNames;
    this.scanStateForDependencies(this._state!);
  }

  public setPaths(paths: Array<keyof TState | '*'>) {
    this._statePaths = paths;
  }

  private scanStateForDependencies(state: TState) {
    this._dependencies.clear();
    this.scanCount += 1;

    if (this._options.variableNames) {
      for (const name of this._options.variableNames) {
        this._dependencies.add(name);
      }
    }

    if (this._statePaths) {
      for (const path of this._statePaths) {
        if (path === '*') {
          this.extractVariablesFrom(state);
          break;
        } else {
          const value = state[path];
          if (value) {
            this.extractVariablesFrom(value);
          }
        }
      }
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
}
