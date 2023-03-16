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
  TimeZone,
} from '@grafana/data';

import { SceneVariableDependencyConfigLike, SceneVariables } from '../variables/types';

export interface SceneObjectStatePlain {
  key?: string;
  $timeRange?: SceneTimeRangeLike;
  $data?: SceneDataProvider;
  $editor?: SceneEditor;
  $variables?: SceneVariables;
}

export interface SceneLayoutChildState extends SceneObjectStatePlain {
  placement?: SceneLayoutChildOptions;
}

export type SceneObjectState = SceneObjectStatePlain | SceneLayoutState | SceneLayoutChildState;

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
  isEditing?: boolean;
}

export type SceneComponent<TModel> = React.FunctionComponent<SceneComponentProps<TModel>>;

export interface SceneDataState extends SceneObjectStatePlain {
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
  readonly urlSync?: SceneObjectUrlSyncHandler<TState>;

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

  /** Called when the Component is mounted. A place to register event listeners add subscribe to state changes */
  activate(): void;

  /** Called when component unmounts. Unsubscribe and closes all subscriptions  */
  deactivate(): void;

  /** Get the scene root */
  getRoot(): SceneObject;

  /** Returns a deep clone this object and all its children */
  clone(state?: Partial<TState>): this;

  /** A React component to use for rendering the object */
  Component(props: SceneComponentProps<SceneObject<TState>>): React.ReactElement | null;

  /** To be replaced by declarative method */
  Editor(props: SceneComponentProps<SceneObject<TState>>): React.ReactElement | null;

  /** Force a re-render, should only be needed when variable values change */
  forceRender(): void;
}

export type SceneLayoutChild = SceneObject<SceneLayoutChildState | SceneLayoutState>;

export interface SceneLayoutState extends SceneLayoutChildState {
  children: SceneLayoutChild[];
}

export interface SceneLayout<T extends SceneLayoutState = SceneLayoutState> extends SceneObject<T> {
  isDraggable(): boolean;
  getDragClass?(): string;
  getDragClassCancel?(): string;
}

export interface SceneEditorState extends SceneObjectStatePlain {
  hoverObject?: SceneObjectRef;
  selectedObject?: SceneObjectRef;
}

export interface SceneEditor extends SceneObject<SceneEditorState> {
  onMouseEnterObject(model: SceneObject): void;
  onMouseLeaveObject(model: SceneObject): void;
  onSelectObject(model: SceneObject): void;
  getEditComponentWrapper(): React.ComponentType<SceneComponentEditWrapperProps>;
}

interface SceneComponentEditWrapperProps {
  editor: SceneEditor;
  model: SceneObject;
  children: React.ReactNode;
}

export interface SceneTimeRangeState extends SceneObjectStatePlain {
  from: string;
  to: string;
  timeZone: TimeZone;
  fiscalYearStartMonth?: number;
  value: TimeRange;
}

export interface SceneTimeRangeLike extends SceneObject<SceneTimeRangeState> {
  onTimeRangeChange(timeRange: TimeRange): void;
  onRefresh(): void;
}

export interface SceneObjectRef {
  ref: SceneObject;
}

export function isSceneObject(obj: any): obj is SceneObject {
  return obj.useState !== undefined;
}

export interface SceneObjectWithUrlSync<TState> extends SceneObject {
  getUrlState(state: TState): SceneObjectUrlValues;
  updateFromUrl(values: SceneObjectUrlValues): void;
}

export interface SceneObjectUrlSyncHandler<TState> {
  getKeys(): string[];
  getUrlState(state: TState): SceneObjectUrlValues;
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
}
