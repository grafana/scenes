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

export class VizPanelRuntimeTransformationsController implements VizPanelRuntimeTransformations {
  private _groups = new Map<string, RuntimeTransformationGroup>();
  private _activeOwners: string[] = [];
  private _listeners = new Map<string, Set<() => void>>();
  private _previousClearPreviousFieldValues?: boolean;
  private _hasPreviousClearPreviousFieldValues = false;
  private _pluginId: string;
  private _data: unknown;
  private _panelStateSubscription?: Unsubscribable;

  public constructor(private _panel: VizPanel) {
    this._pluginId = _panel.state.pluginId;
    this._data = _panel.state.$data;
    this._subscribeToPanelState();

    _panel.addActivationHandler(() => {
      this._handlePanelState();
      this._subscribeToPanelState();

      return () => {
        this._panelStateSubscription?.unsubscribe();
        this._panelStateSubscription = undefined;
      };
    });
  }

  public get(owner: string): readonly DataTransformerConfig[] {
    return this._groups.get(owner)?.transformations ?? NO_TRANSFORMATIONS;
  }

  public set(owner: string, transformations: readonly DataTransformerConfig[]): void {
    const group = this._getOrCreateGroup(owner);
    const wasActive = group.transformations.length > 0;

    if (transformations.length === 0) {
      if (!wasActive) {
        return;
      }

      group.transformations = NO_TRANSFORMATIONS;
      group.sourceSeries = NO_SERIES;
      group.sourceData = undefined;
      group.operator = undefined;
      this._activeOwners = this._activeOwners.filter((activeOwner) => activeOwner !== owner);
    } else {
      const snapshot = freezeDeep(cloneDeep(transformations));
      group.transformations = snapshot;
      group.operator = this._createOperator(group, snapshot);

      if (!wasActive) {
        this._activeOwners.push(owner);
      }
    }

    this._updatePreviousFieldValueCleanup();
    this._reprocessTransformations();
    this._listeners.get(owner)?.forEach((listener) => listener());
  }

  public getSourceSeries(owner: string): readonly DataFrame[] {
    const group = this._groups.get(owner);
    if (group?.transformations.length) {
      return group.sourceSeries;
    }

    return this._getTransformer()?.state.data?.series ?? NO_SERIES;
  }

  public subscribe(owner: string, callback: () => void): () => void {
    let listeners = this._listeners.get(owner);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(owner, listeners);
    }

    listeners.add(callback);

    return () => listeners.delete(callback);
  }

  public getOperators(): CustomTransformOperator[] {
    return this._activeOwners.flatMap((owner) => {
      const operator = this._groups.get(owner)?.operator;
      return operator ? [operator] : [];
    });
  }

  public getClearPreviousFieldValuesForClone(): boolean | undefined {
    return this._hasPreviousClearPreviousFieldValues
      ? this._previousClearPreviousFieldValues
      : this._panel.state._UNSAFE_clearPreviousFieldValues;
  }

  private _subscribeToPanelState(): void {
    if (this._panelStateSubscription) {
      return;
    }

    this._panelStateSubscription = this._panel.subscribeToState(() => this._handlePanelState());
  }

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
      for (const owner of this._activeOwners) {
        const group = this._groups.get(owner)!;
        if (group.sourceData !== $data) {
          group.sourceSeries = NO_SERIES;
          group.sourceData = undefined;
        }
      }
    }
  }

  private _clear(): void {
    const affectedOwners = this._activeOwners;
    if (affectedOwners.length === 0) {
      return;
    }

    this._activeOwners = [];
    for (const owner of affectedOwners) {
      const group = this._groups.get(owner)!;
      group.transformations = NO_TRANSFORMATIONS;
      group.sourceSeries = NO_SERIES;
      group.sourceData = undefined;
      group.operator = undefined;
    }

    this._updatePreviousFieldValueCleanup();
    this._reprocessTransformations();

    for (const owner of affectedOwners) {
      this._listeners.get(owner)?.forEach((listener) => listener());
    }
  }

  private _getOrCreateGroup(owner: string): RuntimeTransformationGroup {
    let group = this._groups.get(owner);
    if (!group) {
      group = { transformations: NO_TRANSFORMATIONS, sourceSeries: NO_SERIES };
      this._groups.set(owner, group);
    }

    return group;
  }

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

  private _getTransformer(): SceneDataTransformer | undefined {
    return this._panel.state.$data instanceof SceneDataTransformer ? this._panel.state.$data : undefined;
  }

  private _reprocessTransformations(): void {
    const transformer = this._getTransformer();
    if (transformer?.isActive) {
      transformer.reprocessTransformations();
    }
  }

  private _updatePreviousFieldValueCleanup(): void {
    if (this._activeOwners.length > 0 && !this._hasPreviousClearPreviousFieldValues) {
      this._previousClearPreviousFieldValues = this._panel.state._UNSAFE_clearPreviousFieldValues;
      this._hasPreviousClearPreviousFieldValues = true;

      if (this._panel.state._UNSAFE_clearPreviousFieldValues) {
        this._panel.setState({ _UNSAFE_clearPreviousFieldValues: false });
      }
    } else if (this._activeOwners.length === 0 && this._hasPreviousClearPreviousFieldValues) {
      if (this._panel.state._UNSAFE_clearPreviousFieldValues !== this._previousClearPreviousFieldValues) {
        this._panel.setState({ _UNSAFE_clearPreviousFieldValues: this._previousClearPreviousFieldValues });
      }
      this._hasPreviousClearPreviousFieldValues = false;
      this._previousClearPreviousFieldValues = undefined;
    }
  }
}
