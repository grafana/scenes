import { Observable } from 'rxjs';

import { BusEventWithPayload } from '@grafana/data';
import { VariableType, VariableHide, DataSourceRef } from '@grafana/schema';

import { SceneObject, SceneObjectState } from '../core/types';

export interface DataSourceControlRef {
  type: 'datasource';
  ref: DataSourceRef;
}

export type ControlSourceRef = DataSourceControlRef;

export interface SceneVariableState extends SceneObjectState {
  type: VariableType;
  name: string;
  label?: string;
  hide?: VariableHide;
  skipUrlSync?: boolean;
  loading?: boolean;
  error?: any | null;
  description?: string | null;
  // Tells which source registered the variable.
  source?: ControlSourceRef;
}

export interface SceneVariable<TState extends SceneVariableState = SceneVariableState> extends SceneObject<TState> {
  /**
   * This function is called on activation or when a dependency changes.
   */
  validateAndUpdate?(): Observable<ValidateAndUpdateResult>;

  /**
   * Should return the value for the given field path
   */
  getValue(fieldPath?: string): VariableValue | undefined | null;

  /**
   * Should return the value display text, used by the "text" formatter
   * Example: ${podId:text}
   * Useful for variables that have non user friendly values but friendly display text names.
   */
  getValueText?(fieldPath?: string): string;

  /**
   * For special edge case senarios. For example local function that locally scoped variables can implement.
   **/
  isAncestorLoading?(): boolean;

  /**
   * Allows cancelling variable execution.
   */
  onCancel?(): void;

  /**
   * Edge case for variables that are hidden but wants to be render to access react contexts (ScopesVariable)
   */
  UNSAFE_renderAsHidden?: boolean;

  /**
   * @experimental
   * Indicates that a variable loads values lazily when user interacts with the variable dropdown.
   */
  isLazy?: boolean;
}

export type VariableValue = VariableValueSingle | VariableValueSingle[];

export type VariableValueSingle = string | boolean | number | CustomVariableValue;

/**
 * This is for edge case values like the custom "allValue" that should not be escaped/formatted like other values
 * The custom all value usually contain wildcards that should not be escaped.
 */
export interface CustomVariableValue {
  /**
   * The format name or function used in the expression
   */
  formatter(formatNameOrFn?: string | VariableCustomFormatterFn): string;
}

export interface ValidateAndUpdateResult {}
export type VariableValueOptionProperties = Record<string, any>;
export interface VariableValueOption {
  label: string;
  value: VariableValueSingle;
  group?: string;
  properties?: VariableValueOptionProperties;
}

export interface SceneVariableSetState extends SceneObjectState {
  variables: SceneVariable[];
}

export interface SceneVariables extends SceneObject<SceneVariableSetState> {
  /**
   * Will look for and return variable matching name
   */
  getByName(name: string): SceneVariable | undefined;
  /**
   * Will return true if the variable is loading or waiting for an update to complete.
   */
  isVariableLoadingOrWaitingToUpdate(variable: SceneVariable): boolean;
}

export class SceneVariableValueChangedEvent extends BusEventWithPayload<SceneVariable> {
  public static type = 'scene-variable-changed-value';
}

export interface SceneVariableDependencyConfigLike {
  /** Return all variable names this object depend on */
  getNames(): Set<string>;

  /** Used to check for dependency on a specific variable */
  hasDependencyOn(name: string): boolean;

  /**
   * Will be called when the VariableSet have completed an update process or when a variable has changed value.
   **/
  variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void;
}

/**
 * Used in CustomFormatterFn
 */
export interface CustomFormatterVariable {
  name: string;
  type: VariableType;
  multi?: boolean;
  includeAll?: boolean;
}

export type VariableCustomFormatterFn = (
  value: unknown,
  legacyVariableModel: Partial<CustomFormatterVariable>,
  legacyDefaultFormatter?: VariableCustomFormatterFn
) => string;

export type InterpolationFormatParameter = string | VariableCustomFormatterFn | undefined;

export function isCustomVariableValue(value: VariableValue): value is CustomVariableValue {
  return typeof value === 'object' && 'formatter' in value;
}
