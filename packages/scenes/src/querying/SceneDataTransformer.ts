import { isEqual } from 'lodash';
import {
  CustomTransformOperator,
  DataFrame,
  DataTopic,
  DataTransformerConfig,
  LoadingState,
  PanelData,
  ScopedVars,
  transformDataFrame,
} from '@grafana/data';
import { toDataQueryError } from '@grafana/runtime';
import { catchError, forkJoin, map, of, ReplaySubject, Unsubscribable } from 'rxjs';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CustomTransformerDefinition, SceneDataProvider, SceneDataProviderResult, SceneDataState } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneDataLayerSet } from './SceneDataLayerSet';
import { findPanelProfiler } from '../utils/findPanelProfiler';
import {
  ResolvedSystemTransformations,
  SystemTransformationsProvider,
} from './systemTransformations/systemTransformationTypes';
import {
  freezeResolved,
  isSystemTransformationsProvider,
  toSystemTransformation,
} from './systemTransformations/systemTransformationProvider';
import { NO_SERIES, NO_SYSTEM_TRANSFORMATIONS } from './systemTransformations/constants';

export interface SceneDataTransformerState extends SceneDataState {
  /**
   * Array of standard transformation configs and custom transform operators.
   * User configured only: system contributed transformations provided by getResolvedSystemTransformations.
   */
  transformations: Array<DataTransformerConfig | CustomTransformerDefinition>;
}

/**
 * You can use this as a $data object. It can either transform an inner $data DataProvider or if that is not set it will
 * subscribe to a DataProvider higher up in the scene graph and transform its data.
 *
 * The transformations array supports custom (runtime defined) transformation as well as declarative core transformations.
 * You can manually re-process the transformations by calling reprocessTransformations(). This is useful if you have
 * transformations that depend on other scene object states.
 */
export class SceneDataTransformer extends SceneObjectBase<SceneDataTransformerState> implements SceneDataProvider {
  private _transformSub?: Unsubscribable;
  private _results = new ReplaySubject<SceneDataProviderResult>(1);
  private _prevDataFromSource?: PanelData;
  /**
   * The provider found on the parent. Kept across deactivation rather than cleared with the subscription:
   * the transformations editor reads getResolvedSystemTransformations for panels that are not currently
   * rendering, and re-discovering on the next activation would be too late. Re-derived from the parent on
   * every activation, so it does not survive a move to a tree whose parent contributes nothing.
   */
  private _provider?: SystemTransformationsProvider;
  /**
   * One slot memo so that a pass resolves the provider once and the editors reading
   * getResolvedSystemTransformations see what the pipeline used rather than re-resolving.
   */
  private _resolvedSystem?: {
    series: DataFrame[];
    resolved: ResolvedSystemTransformations;
  };
  /**
   * Whether a previous activation already ran a pass, which is what makes the provider found on this one a
   * *change* rather than a first discovery. Not carried over by clone, unlike `_prevDataFromSource`.
   */
  private _hasActivatedBefore = false;
  /**
   * What the last pass actually ran, as opposed to what resolves now. Paired with `_prevDataFromSource`:
   * that one records the frames a skippable pass was already run for, this one the transformations it
   * was run with.
   */
  private _lastPassSystem?: ResolvedSystemTransformations;

  /**
   * Scan transformations for variable usage and re-process transforms when a variable values change
   */
  protected _variableDependency: VariableDependencyConfig<SceneDataTransformerState> = new VariableDependencyConfig(
    this,
    {
      statePaths: ['transformations'],
      onReferencedVariableValueChanged: () => this.reprocessTransformations(),
    }
  );

  public constructor(state: SceneDataTransformerState) {
    super(state);

    this.addActivationHandler(() => this.activationHandler());
  }

  private activationHandler() {
    const sourceData = this.getSourceData();

    this._subs.add(sourceData.subscribeToState((state) => this.transform(state.data)));

    // Before the first transform below, so a discovered provider is part of that first pass rather than
    // needing a second, corrective one.
    const providerChanged = this._discoverProvider();

    if (sourceData.state.data) {
      this.transform(sourceData.state.data, providerChanged);
    }

    this._hasActivatedBefore = true;

    return () => {
      if (this._transformSub) {
        this._transformSub.unsubscribe();
      }
    };
  }

  /**
   * Checks the parent for system transformation provider.
   * The provider is kept across deactivation but its subscription is not: _subs is cleared on deactivate, this re-establishes the subscription.
   * Reports whether what the pipeline should run has changed since the last pass, so the caller can force one.
   */
  private _discoverProvider(): boolean {
    const previous = this._provider;
    const provider = this.parent;

    if (!isSystemTransformationsProvider(provider)) {
      // This only ever runs from the activation handler, where the parent is already final, so a parent
      // that is not a provider means anything discovered on a previous activation belongs to a tree this
      // transformer is no longer part of.
      this._provider = undefined;
      this._resolvedSystem = undefined;

      return this._hasActivatedBefore && previous !== undefined;
    }

    this._provider = provider;

    // Nothing was watching the provider while this was inactive, so what it resolves to may have moved on
    // from what the last pass memoized.
    this._resolvedSystem = undefined;

    const sub = provider.subscribeToSystemTransformationsChanged?.(this, () => this.reprocessTransformations());

    if (sub) {
      this._subs.add(sub);
    }

    if (this._hasActivatedBefore && previous !== provider) {
      return true;
    }

    return this._systemChangedSinceLastPass();
  }

  /**
   * Whether the provider resolves to something other than what the last pass ran.
   *
   * The provider instance being unchanged is not enough to conclude the pipeline is unchanged: nothing
   * was watching while this was inactive, so a plugin that finished importing in that window resolves
   * differently now. Source frames usually survive a re-activation unchanged, so without this the pass
   * is skipped as already transformed and state.data keeps frames the reported pipeline never produced.
   */
  private _systemChangedSinceLastPass(): boolean {
    if (!this._lastPassSystem) {
      return false;
    }

    return !isEqual(this._lastPassSystem, this.getResolvedSystemTransformations());
  }

  private getSourceData(): SceneDataProvider {
    if (this.state.$data) {
      if (this.state.$data instanceof SceneDataLayerSet) {
        throw new Error('SceneDataLayerSet can not be used as data provider for SceneDataTransformer.');
      }
      return this.state.$data;
    }

    if (!this.parent || !this.parent.parent) {
      throw new Error('SceneDataTransformer must either have $data set on it or have a parent.parent with $data');
    }

    return sceneGraph.getData(this.parent.parent);
  }

  public setContainerWidth(width: number) {
    if (this.state.$data && this.state.$data.setContainerWidth) {
      this.state.$data.setContainerWidth(width);
    }
  }

  public isDataReadyToDisplay() {
    const dataObject = this.getSourceData();
    if (dataObject.isDataReadyToDisplay) {
      return dataObject.isDataReadyToDisplay();
    }

    return true;
  }

  public reprocessTransformations() {
    // A provider can resolve differently for the same frames - a plugin that was not loaded on the last pass
    // is the reason callers reach for this - so the memo cannot survive a forced re-run.
    this._resolvedSystem = undefined;
    this.transform(this.getSourceData().state.data, true);
  }

  /**
   * The system transformations for the given source frames.
   * Public because provider output never reaches state, so this is the only way for readers
   * (the transformations editor, the inspect data tab) to see what the pipeline is running.
   */
  public getResolvedSystemTransformations(series?: DataFrame[]): ResolvedSystemTransformations {
    const provider = this._provider;

    if (!provider) {
      return NO_SYSTEM_TRANSFORMATIONS;
    }

    const frames = series ?? this._sourceSeriesOrNone();
    const memo = this._resolvedSystem;

    if (memo && memo.series === frames) {
      return memo.resolved;
    }

    const { prepend = [], append = [] } = this._resolveProvider(provider, frames);

    const resolved = freezeResolved({
      prepend: prepend.map((t) => toSystemTransformation(t, 'prepend', provider.origin)),
      append: append.map((t) => toSystemTransformation(t, 'append', provider.origin)),
    });

    this._resolvedSystem = { series: frames, resolved };

    return resolved;
  }

  /**
   * The source frames to resolve a provider against when the caller did not supply their own.
   *
   * Mirrors getSourceData's precondition: reading what is running must not throw for a transformer that is not wired.
   * Since every VizPanel is a provider, a panel without `$data` would throw.
   */
  private _sourceSeriesOrNone(): DataFrame[] {
    if (!this.state.$data && !this.parent?.parent) {
      return NO_SERIES;
    }

    return this.getSourceData().state.data?.series ?? NO_SERIES;
  }

  private _resolveProvider(
    provider: SystemTransformationsProvider,
    series: DataFrame[]
  ): ReturnType<SystemTransformationsProvider['getSystemTransformations']> {
    try {
      return provider.getSystemTransformations(this, { series }) ?? {};
    } catch (err) {
      // A provider is someone else's code running in our data pipeline; contributing nothing is better than erroring
      console.error(`Error resolving system transformations for origin '${provider.origin}': `, err);
      return {};
    }
  }

  /**
   * The system transformations to run for the given source frames.
   */
  private _systemTransformationsFor(series: DataFrame[]): ResolvedSystemTransformations {
    // Without a provider state already holds everything in pipeline order, so the common case stays free.
    return this._provider ? this.getResolvedSystemTransformations(series) : NO_SYSTEM_TRANSFORMATIONS;
  }

  /**
   * Places the user configured transformations between the system tiers, in prepend, user, append order.
   */
  private _withSystemTransformations(
    system: ResolvedSystemTransformations,
    transformations: Array<DataTransformerConfig | CustomTransformerDefinition>
  ): Array<DataTransformerConfig | CustomTransformerDefinition> {
    if (system.prepend.length === 0 && system.append.length === 0) {
      return transformations;
    }

    return [...system.prepend, ...transformations, ...system.append];
  }

  /**
   * S3.1: Calculate transformation complexity metrics
   */
  private _calculateTransformationMetrics(
    data: PanelData,
    transformations: Array<DataTransformerConfig | CustomTransformerDefinition>
  ): {
    transformationCount: number;
    seriesTransformationCount: number;
    annotationTransformationCount: number;
  } {
    const transformationCount = transformations.length;

    // Count transformations by topic (series vs annotations)
    const seriesTransformationCount = transformations.filter((transformation) => {
      if ('options' in transformation || 'topic' in transformation) {
        return transformation.topic == null || transformation.topic === DataTopic.Series;
      }
      return true; // Custom transformations default to series
    }).length;

    const annotationTransformationCount = transformations.filter((transformation) => {
      if ('options' in transformation || 'topic' in transformation) {
        return transformation.topic === DataTopic.Annotations;
      }
      return false;
    }).length;

    return {
      transformationCount,
      seriesTransformationCount,
      annotationTransformationCount,
    };
  }

  public cancelQuery() {
    this.getSourceData().cancelQuery?.();
  }

  public getResultsStream() {
    return this._results;
  }

  public clone(withState?: Partial<SceneDataTransformerState>) {
    const clone = super.clone(withState);

    if (this._prevDataFromSource) {
      clone['_prevDataFromSource'] = this._prevDataFromSource;
      clone['_lastPassSystem'] = this._lastPassSystem;
    }

    return clone;
  }

  public isInViewChanged(isInView: boolean) {
    this.state.$data?.isInViewChanged?.(isInView);
  }

  public bypassIsInViewChanged(bypassIsInView: boolean) {
    this.state.$data?.bypassIsInViewChanged?.(bypassIsInView);
  }

  private haveAlreadyTransformedData(data: PanelData) {
    if (!this._prevDataFromSource) {
      return false;
    }

    if (data === this._prevDataFromSource) {
      return true;
    }

    const { series, annotations } = this._prevDataFromSource;

    if (data.series === series && data.annotations === annotations) {
      if (this.state.data) {
        const currentData = this.state.data;
        const nextData: PanelData = {
          ...data,
          series: currentData.series,
          annotations: currentData.annotations,
        };

        const metadataChanged =
          currentData.state !== nextData.state ||
          currentData.request?.requestId !== nextData.request?.requestId ||
          currentData.error !== nextData.error ||
          !isEqual(currentData.errors, nextData.errors) ||
          !isEqual(currentData.timeRange, nextData.timeRange);

        if (metadataChanged) {
          this.setState({ data: nextData });
          this._results.next({ origin: this, data: nextData });
        }
      }

      return true;
    }

    return false;
  }

  private transform(data: PanelData | undefined, force = false) {
    const timestamp = performance.now();
    // S3.1: Performance tracking entry point
    const profiler = findPanelProfiler(this);
    const transformStartTime = performance.now();
    let transformationId: string | undefined;
    let endTransformCallback:
      | ((
          endTimestamp: number,
          duration: number,
          success: boolean,
          result?: {
            outputSeriesCount?: number;
            outputAnnotationsCount?: number;
            error?: string;
          }
        ) => void)
      | null = null;

    // Resolved once for the whole pass and handed to both tiers, rather than re-derived per position.
    const system = data ? this._systemTransformationsFor(data.series) : NO_SYSTEM_TRANSFORMATIONS;
    const transformations = data ? this._withSystemTransformations(system, this.state.transformations) : [];

    if (transformations.length === 0 || !data) {
      // Transformations are asynchronous, so a pass started when there were some is likely still running.
      // Left subscribed it would complete after this and overwrite the passthrough with stale frames. Not
      // hoisted above the haveAlreadyTransformedData return below: there the data is unchanged, so letting
      // the in-flight pass finish is what we want.
      this._transformSub?.unsubscribe();

      this._prevDataFromSource = data;
      this._lastPassSystem = system;

      // Any source state change re-runs this, so without the guard a passthrough panel publishes a state
      // change carrying data it already had - one no-op event per listener, DashboardSceneChangeTracker
      // included. The results stream still emits: subscribers there are tracking source emissions, not
      // state transitions.
      if (data !== this.state.data) {
        this.setState({ data });
      }

      if (data) {
        this._results.next({ origin: this, data });
      }
      return;
    }

    // Skip transform step if we have already transformed this data
    if (!force && this.haveAlreadyTransformedData(data)) {
      return;
    }

    // S3.1: Start transformation tracking
    if (profiler) {
      // Create meaningful transformation identifier from actual transformations
      const transformationTypes = transformations
        .map((t) => {
          if ('id' in t) {
            // Standard DataTransformerConfig
            return t.id;
          } else {
            // CustomTransformerDefinition
            return 'customTransformation';
          }
        })
        .join('+');
      transformationId = transformationTypes || 'no-transforms';

      // Calculate transformation complexity metrics
      const metrics = this._calculateTransformationMetrics(data, transformations);

      // Start the DataProcessing phase with centralized logging - get end callback
      endTransformCallback = profiler.onDataTransformStart(timestamp, transformationId, metrics);
    }

    this._lastPassSystem = system;

    // Only the user transforms are interpolated.
    const interpolatedTransformations = this._withSystemTransformations(
      system,
      this._interpolateVariablesInTransformationConfigs(data, this.state.transformations)
    );

    const seriesTransformations = this._filterAndPrepareTransformationsByTopic(
      interpolatedTransformations,
      (transformation) => {
        if ('options' in transformation || 'topic' in transformation) {
          return transformation.topic == null || transformation.topic === DataTopic.Series;
        }
        return true;
      }
    );
    const annotationsTransformations = this._filterAndPrepareTransformationsByTopic(
      interpolatedTransformations,
      (transformation) => {
        if ('options' in transformation || 'topic' in transformation) {
          return transformation.topic === DataTopic.Annotations;
        }
        return false;
      }
    );

    if (this._transformSub) {
      this._transformSub.unsubscribe();
    }

    const ctx = {
      interpolate: (value: string, scopedVars?: ScopedVars) => {
        return sceneGraph.interpolate(this, value, { ...data.request?.scopedVars, ...scopedVars });
      },
    };

    const seriesStream = transformDataFrame(seriesTransformations, data.series, ctx);
    const annotationsStream = transformDataFrame(annotationsTransformations, data.annotations ?? []);

    let series: DataFrame[] = [];
    let annotations: DataFrame[] = [];

    this._transformSub = forkJoin([seriesStream, annotationsStream])
      .pipe(
        map((results) => {
          // this strategy allows transformations to take in series frames and produce anno frames
          // we look at each transformation's result and put it in the correct place
          results.forEach((frames) => {
            for (const frame of frames) {
              if (frame.meta?.dataTopic === DataTopic.Annotations) {
                annotations.push(frame);
              } else {
                series.push(frame);
              }
            }
          });

          return { ...data, series, annotations };
        }),
        catchError((err) => {
          const timestamp = performance.now();
          // S3.1: Performance tracking for transformation errors
          const duration = timestamp - transformStartTime;

          if (endTransformCallback) {
            // End the DataProcessing phase with centralized logging using callback
            endTransformCallback(timestamp, duration, false, {
              error: err.message || err,
            });
          }

          console.error('Error transforming data: ', err);
          const sourceErr = this.getSourceData().state.data?.errors || [];

          const transformationError = toDataQueryError(err);
          transformationError.message = `Error transforming data: ${transformationError.message}`;

          const result: PanelData = {
            ...data,
            state: LoadingState.Error,
            // Combine transformation error with upstream errors
            errors: [...sourceErr, transformationError],
          };

          return of(result);
        })
      )
      .subscribe((transformedData) => {
        const timestamp = performance.now();
        const duration = timestamp - transformStartTime;
        if (endTransformCallback) {
          // End the DataProcessing phase with centralized logging using callback
          endTransformCallback(timestamp, duration, true, {
            outputSeriesCount: transformedData.series.length,
            outputAnnotationsCount: transformedData.annotations?.length || 0,
          });
        }
        this.setState({ data: transformedData });
        this._results.next({ origin: this, data: transformedData });
        this._prevDataFromSource = data;
      });
  }

  private _interpolateVariablesInTransformationConfigs(
    data: PanelData,
    transformations: Array<DataTransformerConfig | CustomTransformerDefinition>
  ): Array<DataTransformerConfig | CustomTransformerDefinition> {
    if (this._variableDependency.getNames().size === 0) {
      return transformations;
    }

    // Custom transform operators (bare or in object form) hold functions that a JSON round-trip would drop
    const isInterpolatable = (t: DataTransformerConfig | CustomTransformerDefinition) =>
      typeof t === 'object' && !('operator' in t);

    // If all transformations are config objects we can interpolate them all at once
    if (transformations.every(isInterpolatable)) {
      return JSON.parse(sceneGraph.interpolate(this, JSON.stringify(transformations), data.request?.scopedVars));
    }

    return transformations.map((t) => {
      return isInterpolatable(t)
        ? JSON.parse(sceneGraph.interpolate(this, JSON.stringify(t), data.request?.scopedVars))
        : t;
    });
  }

  private _filterAndPrepareTransformationsByTopic(
    interpolatedTransformations: Array<DataTransformerConfig<any> | CustomTransformerDefinition>,
    transformationFilter: (transformation: DataTransformerConfig<any> | CustomTransformerDefinition) => boolean
  ): Array<DataTransformerConfig<any> | CustomTransformOperator> {
    return interpolatedTransformations
      .filter(transformationFilter)
      .map((transformation) => ('operator' in transformation ? transformation.operator : transformation));
  }
}
