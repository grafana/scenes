import { type DataFrame, type DataTransformerConfig, DataTopic, transformDataFrame } from '@grafana/data';
import { cloneDeep } from 'lodash';
import { mergeMap, tap, type Unsubscribable } from 'rxjs';
import { type CustomTransformerDefinition } from '../../core/types';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import {
  RuntimeTransformationGroup,
  RuntimeTransformationsPanel,
  VizPanelRuntimeTransformations,
} from './VizPanelRuntimeTypes';

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
 * reprocessing. Captured source frames are exposed internally so renderer cleanup can preserve their values.
 *
 * Access this controller through VizPanel.getRuntimeTransformations() instead of constructing it directly.
 */
export class VizPanelRuntimeTransformationsController implements VizPanelRuntimeTransformations {
  // Stores active owners in execution order with their configuration, captured source, and operator.
  private _groups = new Map<string, RuntimeTransformationGroup>();
  // Stores change listeners by owner.
  private _listeners = new Map<string, Set<() => void>>();
  // Tracks the plugin ID so plugin changes can clear runtime transformations.
  private _pluginId: string;
  // Tracks the panel data provider so stale source captures can be discarded.
  private _data: unknown;
  // Holds the current subscription to panel state changes.
  private _panelStateSubscription?: Unsubscribable;
  // Identifies the panel that owns this controller.
  private _panel: RuntimeTransformationsPanel;

  /** Creates a controller and connects it to the panel lifecycle. */
  public constructor(panel: RuntimeTransformationsPanel) {
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
      // Map.set keeps an existing owner's execution position
      this._groups.set(owner, this._createGroup(freezeDeep(cloneDeep(transformations)), this._groups.get(owner)));
    }

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
  public getOperators(): CustomTransformerDefinition[] {
    return Array.from(this._groups.values(), (group) => group.operators).flat();
  }

  public getRetainedDataFrames(): DataFrame[] {
    return Array.from(this._groups.values()).flatMap((group) => Array.from(group.sourceSeries));
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

    this._reprocessTransformations();

    for (const owner of affectedOwners) {
      this._listeners.get(owner)?.forEach((listener) => listener());
    }
  }

  /** Creates an active owner group, keeping the previous capture until the next pass replaces it. */
  private _createGroup(
    transformations: readonly DataTransformerConfig[],
    previous?: RuntimeTransformationGroup
  ): RuntimeTransformationGroup {
    const group: RuntimeTransformationGroup = {
      transformations,
      sourceSeries: previous?.sourceSeries ?? NO_SERIES,
      sourceData: previous?.sourceData,
      operators: [],
    };
    group.operators = this._createOperators(group);

    return group;
  }

  /** Creates one operator per topic, mirroring how SceneDataTransformer routes saved transformations. */
  private _createOperators(group: RuntimeTransformationGroup): CustomTransformerDefinition[] {
    const series = group.transformations.filter((t) => t.topic == null || t.topic === DataTopic.Series);
    const annotations = group.transformations.filter((t) => t.topic === DataTopic.Annotations);

    // The series operator always runs so getSourceSeries() has a capture even for annotation-only owners
    const operators: CustomTransformerDefinition[] = [
      {
        topic: DataTopic.Series,
        operator: (context) => (source) =>
          source.pipe(
            tap((frames) => {
              group.sourceSeries = frames;
              group.sourceData = this._panel.state.$data;
            }),
            mergeMap((frames) => transformDataFrame(series, frames, context))
          ),
      },
    ];

    if (annotations.length > 0) {
      operators.push({
        topic: DataTopic.Annotations,
        operator: (context) => (source) =>
          source.pipe(mergeMap((frames) => transformDataFrame(annotations, frames, context))),
      });
    }

    return operators;
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
}
