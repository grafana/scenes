import { DataLinkBuiltInVars } from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObject, SceneObjectState } from '../core/types';
import { writeSceneLog } from '../utils/writeSceneLog';
import { SCOPES_VARIABLE_NAME, VARIABLE_REGEX } from './constants';

import { SceneVariable, SceneVariableDependencyConfigLike } from './types';
import { safeStringifyValue } from './utils';
import { ConstantVariable } from './variants/ConstantVariable';

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

  /**
   * Handle time macros.
   */
  handleTimeMacros?: boolean;

  /**
   * Will add ScopesVariable as a dependency which will cause updates when the scopes change.
   */
  dependsOnScopes?: boolean;
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

    if (this._options.handleTimeMacros) {
      this.handleTimeMacros();
    }
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
    const dependencyChanged =
      (deps.has(variable.state.name) || deps.has(DataLinkBuiltInVars.includeVars)) && hasChanged;

    writeSceneLog(
      'VariableDependencyConfig',
      'variableUpdateCompleted',
      variable.state.name,
      dependencyChanged,
      this._isWaitingForVariables
    );

    this._options.onAnyVariableChanged?.(variable);

    // If custom handler called when dependency is changed or when we are waiting for variables
    if (this._options.onVariableUpdateCompleted && (this._isWaitingForVariables || dependencyChanged)) {
      this._options.onVariableUpdateCompleted();
    }

    if (dependencyChanged) {
      this._options.onReferencedVariableValueChanged?.(variable);

      // If no callbacks are specified then just do a forceRender
      if (!this._options.onReferencedVariableValueChanged && !this._options.onVariableUpdateCompleted) {
        this._sceneObject.forceRender();
      }
    }
  }

  public hasDependencyInLoadingState() {
    this._isWaitingForVariables = sceneGraph.hasVariableDependencyInLoadingState(this._sceneObject);
    return this._isWaitingForVariables;
  }

  public getNames(): Set<string> {
    const prevState = this._state;
    const newState = (this._state = this._sceneObject.state);

    const noPreviousState = !prevState;
    const stateDiffers = newState !== prevState;

    // First time we always scan for dependencies
    // Second time we only scan if state is a different and if any specific state path has changed
    const shouldScanForDependencies =
      noPreviousState ||
      (stateDiffers &&
        (!this._statePaths || this._statePaths.some((path) => path === '*' || newState[path] !== prevState[path])));

    if (shouldScanForDependencies) {
      this.scanStateForDependencies(newState);
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
    this.scanCount++;

    if (this._options.variableNames) {
      for (const name of this._options.variableNames) {
        this._dependencies.add(name);
      }
    }

    if (this._options.dependsOnScopes) {
      this._dependencies.add(SCOPES_VARIABLE_NAME);
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

  private handleTimeMacros() {
    this._sceneObject.addActivationHandler(() => {
      const timeRange = sceneGraph.getTimeRange(this._sceneObject);

      const sub = timeRange.subscribeToState((newState, oldState) => {
        const deps = this.getNames();
        const hasFromDep = deps.has('__from');
        const hasToDep = deps.has('__to');
        const hasTimeZone = deps.has('__timezone');

        if (newState.value !== oldState.value) {
          // If you have both __from & __to as dependencies you only get notified that from changed and vice versa
          if (hasFromDep) {
            const variable = new ConstantVariable({ name: '__from', value: newState.from });
            this.variableUpdateCompleted(variable, true);
          } else if (hasToDep) {
            const variable = new ConstantVariable({ name: '__to', value: newState.to });
            this.variableUpdateCompleted(variable, true);
          }
        }

        if (newState.timeZone !== oldState.timeZone && hasTimeZone) {
          const variable = new ConstantVariable({ name: '__timezone', value: newState.timeZone });
          this.variableUpdateCompleted(variable, true);
        }
      });

      return () => sub.unsubscribe();
    });
  }
}
