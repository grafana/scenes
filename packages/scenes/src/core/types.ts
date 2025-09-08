import React from 'react';
import { MonoTypeOperatorFunction, Observable, Unsubscribable } from 'rxjs';

import {
  BusEvent,
  BusEventHandler,
  BusEventType,
  DataFrame,
  DataQueryRequest,
  DataSourceGetTagKeysOptions,
  DataSourceGetTagValuesOptions,
  DataTransformContext,
  PanelData,
  TimeRange,
} from '@grafana/data';
import { DataQuery, DataTopic, TimeZone } from '@grafana/schema';

import { SceneVariableDependencyConfigLike, SceneVariables } from '../variables/types';
import { SceneObjectRef } from './SceneObjectRef';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { WeekStart } from '@grafana/ui';

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

  /** Controls if activation blocks rendering */
  readonly renderBeforeActivation: boolean;

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

  /** Returns a SceneObjectRef that will resolve to this object */
  getRef(): SceneObjectRef<this>;

  /**
   * Allows external code to register code that is executed on activate and deactivate. This allow you
   * to wire up scene objects that need to respond to state changes in other objects from the outside.
   **/
  addActivationHandler(handler: SceneActivationHandler): void;

  /**
   * Loop through state and call callback for each direct child scene object.
   * Checks 1 level deep properties and arrays. So a scene object hidden in a nested plain object will not be detected.
   * Return false to exit loop early.
   */
  forEachChild(callback: (child: SceneObject) => void): void | false;

  /**
   * Useful for edge cases when you want to move a scene object to another parent.
   */
  clearParent(): void;
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
  getDragHooks?(): { onDragStart?: (e: React.PointerEvent, panel: VizPanel) => void };
}

export interface SceneTimeRangeState extends SceneObjectState {
  from: string;
  to: string;
  fiscalYearStartMonth?: number;
  value: TimeRange;
  timeZone?: TimeZone;
  /** weekStart will change the global date locale so having multiple different weekStart values is not supported  */
  weekStart?: WeekStart;
  /**
   * @internal
   * To enable feature parity with the old time range picker, not sure if it will be kept.
   * Override the now time by entering a time delay. Use this option to accommodate known delays in data aggregation to avoid null values.
   * */
  UNSAFE_nowDelay?: string;

  refreshOnActivate?: {
    /**
     * When set, the time range will invalidate relative ranges after the specified interval has elapsed
     */
    afterMs?: number;
    /**
     * When set, the time range will invalidate relative ranges after the specified percentage of the current interval has elapsed.
     * If both invalidate values are set, the smaller value will be used for the given interval.
     */
    percent?: number;
  };
}

export interface SceneTimeRangeLike extends SceneObject<SceneTimeRangeState> {
  onTimeZoneChange(timeZone: TimeZone): void;
  onTimeRangeChange(timeRange: TimeRange): void;
  onRefresh(): void;
  getTimeZone(): TimeZone;
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
  shouldCreateHistoryStep?(values: SceneObjectUrlValues): boolean;
  performBrowserHistoryAction?(callback: () => void): void;
}

export interface DataRequestEnricher {
  // Return partial data query request that will be merged with the original request provided by SceneQueryRunner
  enrichDataRequest(source: SceneObject): Partial<DataQueryRequest> | null;
}

export interface FiltersRequestEnricher {
  // Return partial getTagKeys or getTagValues query request that will be merged with the original request provided by ad hoc or group by variable
  enrichFiltersRequest(
    source: SceneObject
  ): Partial<DataSourceGetTagKeysOptions | DataSourceGetTagValuesOptions> | null;
}

export function isDataRequestEnricher(obj: any): obj is DataRequestEnricher {
  return 'enrichDataRequest' in obj;
}

export function isFiltersRequestEnricher(obj: any): obj is FiltersRequestEnricher {
  return 'enrichFiltersRequest' in obj;
}

export type SceneObjectUrlValue = string | string[] | undefined | null;
export type SceneObjectUrlValues = Record<string, SceneObjectUrlValue>;

export type CustomTransformOperator = (context: DataTransformContext) => MonoTypeOperatorFunction<DataFrame[]>;
export type CustomTransformerDefinition =
  | { operator: CustomTransformOperator; topic: DataTopic }
  | CustomTransformOperator;
export type SceneStateChangedHandler<TState> = (newState: TState, prevState: TState) => void;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface SceneDataProviderResult {
  data: PanelData;
  origin: SceneDataProvider;
}

export interface SceneDataProvider<T extends SceneObjectState = SceneDataState> extends SceneObject<T> {
  setContainerWidth?: (width: number) => void;
  isDataReadyToDisplay?: () => boolean;
  cancelQuery?: () => void;
  getResultsStream(): Observable<SceneDataProviderResult>;
}

export interface SceneDataLayerProviderState extends SceneDataState {
  name: string;
  description?: string;
  isEnabled?: boolean;
  isHidden?: boolean;
}

export interface SceneDataLayerProvider extends SceneDataProvider<SceneDataLayerProviderState> {
  isDataLayer: true;
}

export function isDataLayer(obj: SceneObject): obj is SceneDataLayerProvider {
  return 'isDataLayer' in obj;
}

export interface DataLayerFilter {
  panelId: number;
}

export interface SceneStatelessBehavior<T extends SceneObject = any> {
  (sceneObject: T): CancelActivationHandler | void;
}

export type ControlsLayout = 'horizontal' | 'vertical';

export interface UseStateHookOptions {
  /**
   * For some edge cases other scene objects want to subscribe to scene object state for objects
   * that are not active, or whose main React Component can be un-mounted. Set this to true
   * to keep the scene object active even if the React component is unmounted.
   *
   * Normally you would not need this but this can be useful in some edge cases.
   *
   * @experimental
   */
  shouldActivateOrKeepAlive?: boolean;
}

export interface SceneDataQuery extends DataQuery {
  [key: string]: any;

  // Opt this query out of time window comparison
  timeRangeCompare?: boolean;
}

export interface SceneUrlSyncOptions {
  /**
   * This will update the url to contain all scene url state
   * when the scene is initialized. Important for browser history "back" actions.
   */
  updateUrlOnInit?: boolean;
  /**
   * This is only supported by some objects if they implement
   * shouldCreateHistoryStep where they can control what changes
   * url changes should add a new browser history entry.
   */
  createBrowserHistorySteps?: boolean;
  /**
   * This will automatically prefix url search parameters when syncing.
   * Can be used to prevent collisions when multiple Scene apps are embedded in the page.
   */
  namespace?: string;
  /**
   * When `namespace` is provided, this prevents some url search parameters to be automatically prefixed.
   * Defaults to the timerange parameters (["from", "to", "timezone"])
   */
  excludeFromNamespace?: string[];
}
