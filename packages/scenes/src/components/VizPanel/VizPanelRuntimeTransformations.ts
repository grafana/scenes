import {
  type CustomTransformOperator,
  type DataFrame,
  type DataTransformerConfig,
  transformDataFrame,
} from '@grafana/data';
import { cloneDeep } from 'lodash';
import { mergeMap, tap, type Unsubscribable } from 'rxjs';

import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import type { VizPanel } from './VizPanel';

const NO_TRANSFORMATIONS: readonly DataTransformerConfig[] = Object.freeze([]);
const NO_SERIES: readonly DataFrame[] = Object.freeze([]);

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value;
  }

  seen.add(value);
  for (const nestedValue of Object.values(value)) {
    freezeDeep(nestedValue, seen);
  }

  return Object.freeze(value) as T;
}

export interface VizPanelRuntimeTransformations {
  /** Returns the same immutable snapshot until this owner changes. */
  get(owner: string): readonly DataTransformerConfig[];

  /** Replaces one owner's transformations. An empty list removes the owner. */
  set(owner: string, transformations: readonly DataTransformerConfig[]): void;

  /** Returns the frames entering this owner's transformation stage. */
  getSourceSeries(owner: string): readonly DataFrame[];

  /** Subscribes to changes for one owner. */
  subscribe(owner: string, callback: () => void): () => void;
}

interface RuntimeTransformationGroup {
  transformations: readonly DataTransformerConfig[];
  sourceSeries: readonly DataFrame[];
  sourceData?: unknown;
  operator?: CustomTransformOperator;
}

/**
 * Manages non-serializable transformations that change a VizPanel's current output without changing its saved state.
 * This supports temporary viewer behavior, such as hiding or reordering table columns, without dirtying a dashboard.
 *
 * Each feature uses a stable owner string and controls one independent transformation stage. Active owners run after
 * plugin and saved transformations in registration order. Each stage captures its input frames so its owner can read
 * fields that the stage removes. Updating an active owner reprocesses the current data without issuing a new query.
 *
 * The controller belongs to one VizPanel and remains stable when the panel replaces its data transformer. A plugin
 * change clears all owners because their transformations can depend on the previous visualization. Panel clones get a
 * new empty controller and do not inherit runtime output.
 *
 * Transformation snapshots are deep-cloned and frozen so all changes go through set(), notify subscribers, and trigger
 * reprocessing. Captured source frames also require previous field values to remain available, so the controller
 * temporarily disables field-value cleanup while an owner is active and restores the prior setting after the last owner
 * is removed.
 *
 * Access this controller through VizPanel.getRuntimeTransformations() instead of constructing it directly.
 */
export class VizPanelRuntimeTransformationsController implements VizPanelRuntimeTransformations {
  // Stores active owners in execution order with their configuration, captured source, and operator.
  private _groups = new Map<string, RuntimeTransformationGroup>();
  // Stores change listeners by owner.
  private _listeners = new Map<string, Set<() => void>>();
  // Stores the cleanup setting that was active before the first runtime owner.
  private _previousClearPreviousFieldValues?: boolean;
  // Distinguishes a stored undefined cleanup setting from no stored setting.
  private _hasPreviousClearPreviousFieldValues = false;
  // Tracks the plugin ID so plugin changes can clear runtime transformations.
  private _pluginId: string;
  // Tracks the panel data provider so stale source captures can be discarded.
  private _data: unknown;
  // Holds the current subscription to panel state changes.
  private _panelStateSubscription?: Unsubscribable;
  // Identifies the panel that owns this controller.
  private _panel: VizPanel;

  /** Creates a controller and connects it to the panel lifecycle. */
  public constructor(panel: VizPanel) {
    this._panel = panel;
    this._pluginId = panel.state.pluginId;
    this._data = panel.state.$data;
    this._subscribeToPanelState();

    panel.addActivationHandler(() => {
      this._handlePanelState();
      this._subscribeToPanelState();

      return () => {
        this._panelStateSubscription?.unsubscribe();
        this._panelStateSubscription = undefined;
      };
    });
  }

  /** Returns the current immutable transformation snapshot for an owner. */
  public get(owner: string): readonly DataTransformerConfig[] {
    return this._groups.get(owner)?.transformations ?? NO_TRANSFORMATIONS;
  }

  /** Replaces or removes an owner's transformations and refreshes panel data. */
  public set(owner: string, transformations: readonly DataTransformerConfig[]): void {
    if (transformations.length === 0) {
      if (!this._groups.delete(owner)) {
        return;
      }
    } else {
      const snapshot = freezeDeep(cloneDeep(transformations));
      const group = this._groups.get(owner);
      if (group) {
        group.transformations = snapshot;
        group.operator = this._createOperator(group, snapshot);
      } else {
        this._groups.set(owner, this._createGroup(snapshot));
      }
    }

    this._updatePreviousFieldValueCleanup();
    this._reprocessTransformations();
    this._listeners.get(owner)?.forEach((listener) => listener());
  }

  /** Returns the frames that enter an owner's stage. */
  public getSourceSeries(owner: string): readonly DataFrame[] {
    const group = this._groups.get(owner);
    if (group?.transformations.length) {
      return group.sourceSeries;
    }

    return this._getTransformer()?.state.data?.series ?? NO_SERIES;
  }

  /** Registers a listener for changes to one owner. */
  public subscribe(owner: string, callback: () => void): () => void {
    let listeners = this._listeners.get(owner);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(owner, listeners);
    }

    listeners.add(callback);

    return () => listeners.delete(callback);
  }

  /** Returns active runtime operators in execution order. */
  public getOperators(): CustomTransformOperator[] {
    return Array.from(this._groups.values(), (group) => group.operator!);
  }

  /** Returns the field cleanup setting that a clone must inherit. */
  public getClearPreviousFieldValuesForClone(): boolean | undefined {
    return this._hasPreviousClearPreviousFieldValues
      ? this._previousClearPreviousFieldValues
      : this._panel.state._UNSAFE_clearPreviousFieldValues;
  }

  /** Subscribes to panel state changes when no subscription is active. */
  private _subscribeToPanelState(): void {
    if (this._panelStateSubscription) {
      return;
    }

    this._panelStateSubscription = this._panel.subscribeToState(() => this._handlePanelState());
  }

  /** Handles plugin and data provider changes from the owning panel. */
  private _handlePanelState(): void {
    const { pluginId, $data } = this._panel.state;

    if (pluginId !== this._pluginId) {
      this._pluginId = pluginId;
      this._data = $data;
      this._clear();
      return;
    }

    if ($data !== this._data) {
      this._data = $data;
      for (const group of this._groups.values()) {
        if (group.sourceData !== $data) {
          group.sourceSeries = NO_SERIES;
          group.sourceData = undefined;
        }
      }
    }
  }

  /** Removes all active owners and notifies their listeners. */
  private _clear(): void {
    const affectedOwners = Array.from(this._groups.keys());
    if (affectedOwners.length === 0) {
      return;
    }

    this._groups.clear();

    this._updatePreviousFieldValueCleanup();
    this._reprocessTransformations();

    for (const owner of affectedOwners) {
      this._listeners.get(owner)?.forEach((listener) => listener());
    }
  }

  /** Creates an active owner group. */
  private _createGroup(transformations: readonly DataTransformerConfig[]): RuntimeTransformationGroup {
    const group: RuntimeTransformationGroup = { transformations, sourceSeries: NO_SERIES };
    group.operator = this._createOperator(group, transformations);

    return group;
  }

  /** Creates an operator that captures its input before applying transformations. */
  private _createOperator(
    group: RuntimeTransformationGroup,
    transformations: readonly DataTransformerConfig[]
  ): CustomTransformOperator {
    return (context) => (source) =>
      source.pipe(
        tap((frames) => {
          group.sourceSeries = frames;
          group.sourceData = this._panel.state.$data;
        }),
        mergeMap((frames) => transformDataFrame(Array.from(transformations), frames, context))
      );
  }

  /** Returns the panel's data provider when it is a transformer. */
  private _getTransformer(): SceneDataTransformer | undefined {
    return this._panel.state.$data instanceof SceneDataTransformer ? this._panel.state.$data : undefined;
  }

  /** Reprocesses current data when the panel transformer is active. */
  private _reprocessTransformations(): void {
    const transformer = this._getTransformer();
    if (transformer?.isActive) {
      transformer.reprocessTransformations();
    }
  }

  /** Disables field cleanup while runtime owners need retained source values. */
  private _updatePreviousFieldValueCleanup(): void {
    if (this._groups.size > 0 && !this._hasPreviousClearPreviousFieldValues) {
      this._previousClearPreviousFieldValues = this._panel.state._UNSAFE_clearPreviousFieldValues;
      this._hasPreviousClearPreviousFieldValues = true;

      if (this._panel.state._UNSAFE_clearPreviousFieldValues) {
        this._panel.setState({ _UNSAFE_clearPreviousFieldValues: false });
      }
    } else if (this._groups.size === 0 && this._hasPreviousClearPreviousFieldValues) {
      if (this._panel.state._UNSAFE_clearPreviousFieldValues !== this._previousClearPreviousFieldValues) {
        this._panel.setState({ _UNSAFE_clearPreviousFieldValues: this._previousClearPreviousFieldValues });
      }
      this._hasPreviousClearPreviousFieldValues = false;
      this._previousClearPreviousFieldValues = undefined;
    }
  }
}
