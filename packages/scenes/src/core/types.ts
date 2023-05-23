import React from 'react';
import { MonoTypeOperatorFunction, Unsubscribable } from 'rxjs';

import {
  BusEvent,
  BusEventHandler,
  BusEventType,
  DataFrame,
  DataTransformContext,
  PanelData,
  TimeRange,
} from '@grafana/data';
import { TimeZone } from '@grafana/schema';

import { SceneVariableDependencyConfigLike, SceneVariables } from '../variables/types';

export interface SceneObjectState {
  key?: string;
  $timeRange?: SceneTimeRangeLike;
  $data?: SceneDataProvider;
  $variables?: SceneVariables;
  /**
   * @experimental
   * Can be used to add extra behaviors to a scene object.
   * These are activated when the their parent scene object is activated.
   */
  $behaviors?: Array<SceneObject | SceneStatelessBehavior>;
}

export interface SceneLayoutChildOptions {
  width?: number | string;
  height?: number | string;
  xSizing?: 'fill' | 'content';
  ySizing?: 'fill' | 'content';
  x?: number;
  y?: number;
  minWidth?: number | string;
  minHeight?: number | string;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface SceneComponentProps<T> {
  model: T;
}

export type SceneComponent<TModel> = (props: SceneComponentProps<TModel>) => React.ReactElement | null;

export interface SceneDataState extends SceneObjectState {
  data?: PanelData;
}

export interface SceneObject<TState extends SceneObjectState = SceneObjectState> {
  /** The current state */
  readonly state: TState;

  /** True when there is a React component mounted for this Object */
  readonly isActive: boolean;

  /** SceneObject parent */
  readonly parent?: SceneObject;

  /** This abtractions declares what variables the scene object depends on and how to handle when they change value. **/
  readonly variableDependency?: SceneVariableDependencyConfigLike;

  /** This abstraction declares URL sync dependencies of a scene object. **/
  readonly urlSync?: SceneObjectUrlSyncHandler;

  /** Subscribe to state changes */
  subscribeToState(handler: SceneStateChangedHandler<TState>): Unsubscribable;

  /** Subscribe to a scene event */
  subscribeToEvent<T extends BusEvent>(typeFilter: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable;

  /** Publish an event and optionally bubble it up the scene */
  publishEvent(event: BusEvent, bubble?: boolean): void;

  /** Utility hook that wraps useObservable. Used by React components to subscribes to state changes */
  useState(): TState;

  /** How to modify state */
  setState(state: Partial<TState>): void;

  /**
   * Called when the Component is mounted. This will also activate any $data, $variables or $timeRange scene object on this level.
   * Don't override this in your custom SceneObjects, instead use addActivationHandler from the constructor.
   **/
  activate(): CancelActivationHandler;

  /** Get the scene root */
  getRoot(): SceneObject;

  /** Returns a deep clone this object and all its children */
  clone(state?: Partial<TState>): this;

  /** A React component to use for rendering the object */
  Component(props: SceneComponentProps<SceneObject<TState>>): React.ReactElement | null;

  /** Force a re-render, should only be needed when variable values change */
  forceRender(): void;

  /**
   * Allows external code to register code that is executed on activate and deactivate. This allow you
   * to wire up scene objects that need to respond to state changes in other objects from the outside.
   **/
  addActivationHandler(handler: SceneActivationHandler): void;

  /**
   * Loop through state and call callback for each direct child scene object.
   * Checks 1 level deep properties and arrays. So a scene object hidden in a nested plain object will not be detected.
   */
  forEachChild(callback: (child: SceneObject) => void): void;
}

export type SceneActivationHandler = () => SceneDeactivationHandler | void;
export type SceneDeactivationHandler = () => void;

/**
 * Function returned by activate() that when called will deactivate the object if it's the last activator
 **/
export type CancelActivationHandler = () => void;

export interface SceneLayoutState extends SceneObjectState {
  children: SceneObject[];
}

export interface SceneLayout<T extends SceneLayoutState = SceneLayoutState> extends SceneObject<T> {
  isDraggable(): boolean;
  getDragClass?(): string;
  getDragClassCancel?(): string;
}

export interface SceneTimeRangeState extends SceneObjectState {
  from: string;
  to: string;
  fiscalYearStartMonth?: number;
  value: TimeRange;
  timeZone?: TimeZone;
}

export interface SceneTimeRangeLike extends SceneObject<SceneTimeRangeState> {
  onTimeZoneChange(timeZone: TimeZone): void;
  onTimeRangeChange(timeRange: TimeRange): void;
  onRefresh(): void;
  getTimeZone(): TimeZone;
}

export interface SceneObjectRef {
  ref: SceneObject;
}

export function isSceneObject(obj: any): obj is SceneObject {
  return obj.useState !== undefined;
}

export interface SceneObjectWithUrlSync extends SceneObject {
  getUrlState(): SceneObjectUrlValues;
  updateFromUrl(values: SceneObjectUrlValues): void;
}

export interface SceneObjectUrlSyncHandler {
  getKeys(): string[];
  getUrlState(): SceneObjectUrlValues;
  updateFromUrl(values: SceneObjectUrlValues): void;
}

export type SceneObjectUrlValue = string | string[] | undefined | null;
export type SceneObjectUrlValues = Record<string, SceneObjectUrlValue>;

export type CustomTransformOperator = (context: DataTransformContext) => MonoTypeOperatorFunction<DataFrame[]>;
export type SceneStateChangedHandler<TState> = (newState: TState, prevState: TState) => void;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface SceneDataProvider extends SceneObject<SceneDataState> {
  setContainerWidth?: (width: number) => void;
  isDataReadyToDisplay?: () => boolean;
}

export type SceneStatelessBehavior = (sceneObject: SceneObject) => CancelActivationHandler | void;
