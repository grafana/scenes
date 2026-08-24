import { isEqual, isEqualWith } from 'lodash';
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
import {
  CustomTransformerDefinition,
  SceneDataProvider,
  SceneDataProviderResult,
  SceneDataState,
  SystemTransformationPosition,
  TransformationOrigin,
} from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneDataLayerSet } from './SceneDataLayerSet';
import { findPanelProfiler } from '../utils/findPanelProfiler';

/**
 * A transformation that setSystemTransformations has tagged with where it came from. The tag is stamped on
 * by this class, which is why origin and position are not part of the definition types callers pass in - a
 * hand written tag would be dropped by the next setSystemTransformations call for that origin.
 */
export type SystemTransformation = (
  | DataTransformerConfig
  | Exclude<CustomTransformerDefinition, CustomTransformOperator>
) & {
  origin: TransformationOrigin;
  position: SystemTransformationPosition;
};

export type SceneDataTransformation = DataTransformerConfig | CustomTransformerDefinition | SystemTransformation;

/**
 * Resolves one origin's system transformations from the frames that are about to enter the pipeline. Pass
 * this to setSystemTransformations instead of concrete arrays when the configs depend on the data: a
 * supplier sees the source frames, which is what a caller holding only the pipeline output cannot.
 *
 * It runs inside transform(), so it has to be synchronous and must not write scene state. Throwing is
 * treated as contributing nothing rather than failing the data stream. Its output is not scanned for
 * variable dependencies, so a supplier whose configs reference variables has to resolve them itself.
 */
export type SystemTransformationsSupplier = (ctx: { series: DataFrame[] }) => {
  prepend?: Array<DataTransformerConfig | CustomTransformerDefinition>;
  append?: Array<DataTransformerConfig | CustomTransformerDefinition>;
};

/**
 * The system transformations in effect for a given set of source frames: the concrete ones held in state
 * merged with whatever the suppliers resolved to, in pipeline order.
 */
export interface ResolvedSystemTransformations {
  prepend: SystemTransformation[];
  append: SystemTransformation[];
}

interface SystemTransformationGroup {
  prepend: SystemTransformation[];
  append: SystemTransformation[];
}

/**
 * Stands in for the source frames before the first query result. Shared rather than allocated per call so
 * that repeated no-argument getResolvedSystemTransformations reads keep hitting the memo, which compares
 * frames by identity - a fresh [] each time would miss and re-run every supplier.
 */
const NO_SERIES: DataFrame[] = [];

export interface SceneDataTransformerState extends SceneDataState {
  /**
   * Array of standard transformation configs and custom transform operators.
   * Entries carrying an origin are runtime transformations added programmatically via
   * setSystemTransformations. They are combined with the user configured ones but should not be
   * persisted or shown in the transformations editor (filter them out with isSystemTransformation).
   * Ones that setSystemTransformations resolves from a supplier never reach this array at all - read
   * those with getResolvedSystemTransformations.
   */
  transformations: SceneDataTransformation[];
}

/**
 * Returns true for transformations added via SceneDataTransformer.setSystemTransformations, whichever origin
 * injected them. That is the question persisting and editing want to ask; use isTransformationFrom when a
 * provider needs to reason about only the entries it owns.
 */
export function isSystemTransformation(
  transformation: SceneDataTransformation
): transformation is SystemTransformation {
  return (
    typeof transformation === 'object' &&
    transformation !== null &&
    'origin' in transformation &&
    transformation.origin != null
  );
}

/**
 * Builds the origin scoped version of isSystemTransformation, for the narrower question a provider needs:
 * whether the entries it owns are installed, ignoring the ones it neither adds nor removes. Returns a
 * predicate rather than taking the origin alongside the transformation so that it stays usable with
 * filter and some, which would otherwise pass their index argument into the origin slot.
 */
export function isTransformationFrom(origin: TransformationOrigin) {
  return (transformation: SceneDataTransformation): transformation is SystemTransformation =>
    isSystemTransformation(transformation) && transformation.origin === origin;
}

function toSystemTransformation(
  transformation: DataTransformerConfig | CustomTransformerDefinition,
  position: SystemTransformationPosition,
  origin: TransformationOrigin
): SystemTransformation {
  if (typeof transformation === 'function') {
    return { operator: transformation, topic: DataTopic.Series, origin, position };
  }

  return { ...transformation, origin, position };
}

/**
 * Custom transform operators are functions, so a deep comparison falls back to reference equality and an
 * operator that a caller rebuilds inline always looks like a change. Where both sides carry the same `key`
 * the reference is ignored, since the key is the caller's declaration that the operator is unchanged. Every
 * other field still compares structurally, so a changed topic or position is still picked up.
 */
function haveEqualTransformations(a: SceneDataTransformation[], b: SceneDataTransformation[]) {
  return isEqualWith(a, b, (_, __, prop, aParent, bParent) => {
    if (prop === 'operator' && typeof aParent?.key === 'string' && aParent.key === bParent?.key) {
      return true;
    }

    return undefined;
  });
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
  private _suppliers = new Map<TransformationOrigin, SystemTransformationsSupplier>();
  /**
   * Every origin that has called setSystemTransformations, in call order. This is the only record of an
   * origin that registered nothing but a supplier, since such an origin puts nothing in state - drop this
   * and its supplier stops being resolved at all, not just resolved out of order.
   */
  private _originOrder: TransformationOrigin[] = [];
  /**
   * One slot memo so that a pass resolves each supplier once and the editors reading
   * getResolvedSystemTransformations see what the pipeline used rather than re-running the suppliers.
   */
  private _resolvedSystem?: {
    series: DataFrame[];
    state: SceneDataTransformation[];
    resolved: ResolvedSystemTransformations;
  };

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

    if (sourceData.state.data) {
      this.transform(sourceData.state.data);
    }

    return () => {
      if (this._transformSub) {
        this._transformSub.unsubscribe();
      }
    };
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
    // Suppliers can resolve differently for the same frames - a plugin that was not loaded on the last pass
    // is the reason callers reach for this - so the memo cannot survive a forced re-run.
    this._resolvedSystem = undefined;
    this.transform(this.getSourceData().state.data, true);
  }

  /**
   * Sets the system (runtime) transformations for the given origin and combines them with the user
   * configured ones. Prepended transformations run before the user transformations, appended ones after.
   * Each provided transformation is tagged with the origin (default 'plugin'). Previous transformations
   * with the same origin are replaced rather than appended, so repeated calls never accumulate
   * duplicates; transformations from other origins are preserved.
   *
   * Pass a `supplier` in place of concrete arrays when the configs have to be derived from the data. It is
   * called with the frames entering the pipeline on every pass, so its output tracks the query result and
   * is never held in state; because of that, registering, swapping or dropping one re-runs the pipeline
   * whenever it changes what resolves for the current frames, which the transformations comparison cannot
   * see. An origin can provide both, in which case the supplied entries follow the concrete ones within
   * each tier.
   *
   * Repeated calls only skip re-running the pipeline when the resulting transformations are equal to the
   * current ones. Custom transform operators are functions and so compare by reference: a caller that
   * builds them inline would re-run the pipeline and emit new data on every call, which loops if it
   * re-applies on data change. Give such operators a stable `key` to declare identity instead - matching
   * keys make the operator reference irrelevant, and changing the key signals a real change.
   *
   * Resulting pipeline order: prepended system transformations, the user configured ones, then appended
   * system transformations. Origins are replaced independently, so once a second provider exists its
   * entries slot into the same prepend and append tiers without disturbing this one's, ordered by which
   * origin called this first.
   */
  public setSystemTransformations({
    prepend = [],
    append = [],
    supplier,
    origin = 'plugin',
  }: {
    prepend?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    append?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    supplier?: SystemTransformationsSupplier;
    origin?: TransformationOrigin;
  }) {
    if (!this._originOrder.includes(origin)) {
      this._originOrder.push(origin);
    }

    // A supplier is resolved from the frames rather than stored in state, so nothing about swapping one
    // shows up in the transformations comparison below - re-running the pipeline has to be decided here.
    const previousSupplier = this._suppliers.get(origin);
    const supplierChanged = previousSupplier !== supplier;

    if (supplier) {
      this._suppliers.set(origin, supplier);
    } else {
      this._suppliers.delete(origin);
    }

    // Guarded on isActive because _applyTransformations would not reprocess otherwise, so the resolution
    // this costs would be spent to answer a question nobody asked.
    const force =
      supplierChanged && this.isActive && this._supplierSwapChangesResolution(previousSupplier, supplier, origin);

    this._resolvedSystem = undefined;

    const { system, user } = this._partitionTransformations();

    system.set(origin, {
      prepend: prepend.map((t) => toSystemTransformation(t, 'prepend', origin)),
      append: append.map((t) => toSystemTransformation(t, 'append', origin)),
    });

    this._applyTransformations(this._combineTransformations(system, user), force);
  }

  /**
   * Whether swapping this origin's supplier changes what the pipeline would resolve to. A changed reference
   * says nothing on its own, and the common case says nothing interesting: a panel whose plugin contributes
   * no transformations resolves empty both before and after, and forcing a pass for that costs a redundant
   * emission per panel on every dashboard load, since `$data` activates before whatever registers the
   * supplier and the registration therefore always lands after the first pass.
   *
   * Answering it calls both suppliers once for the current frames, which is why the contract asks for them
   * to be cheap and free of side effects. Comparing the two directly rather than against the last pass
   * keeps the question narrow: does this swap change anything? A supplier whose own output has drifted for
   * unrelated reasons is what reprocessTransformations is for.
   */
  private _supplierSwapChangesResolution(
    previous: SystemTransformationsSupplier | undefined,
    next: SystemTransformationsSupplier | undefined,
    origin: TransformationOrigin
  ): boolean {
    const series = this.getSourceData().state.data?.series ?? NO_SERIES;

    // Tagged the way the pipeline would see them, so the comparison answers "would it run the same
    // entries" rather than "did the supplier spell them the same way" - a bare operator and its object
    // form are one entry to the pipeline and must not count as a change
    const resolve = (supplier: SystemTransformationsSupplier | undefined) => {
      const { prepend = [], append = [] } = this._resolveSupplier(supplier, series, origin);

      return {
        prepend: prepend.map((t) => toSystemTransformation(t, 'prepend', origin)),
        append: append.map((t) => toSystemTransformation(t, 'append', origin)),
      };
    };

    const before = resolve(previous);
    const after = resolve(next);

    return (
      !haveEqualTransformations(before.prepend, after.prepend) || !haveEqualTransformations(before.append, after.append)
    );
  }

  /**
   * The system transformations in effect for the given source frames: the concrete ones held in state
   * merged with whatever the suppliers resolve to, each tier in origin registration order.
   *
   * This is the single source of truth for anything that needs to know what the pipeline is running -
   * a transformations editor listing the runtime entries as read only rows, say - since supplier output
   * never reaches state.
   *
   * Defaults to the frames the pipeline is working on, which is what a caller asking "what is running
   * right now" wants, and shares the pipeline's memo instead of resolving the suppliers a second time.
   * Do not reach for this object's own `state.data.series` to fill the argument: that is pipeline output,
   * and resolving a supplier against it asks the question the supplier exists to avoid. Pass frames
   * explicitly only to ask about a set this transformer is not currently running.
   */
  public getResolvedSystemTransformations(
    series: DataFrame[] = this.getSourceData().state.data?.series ?? NO_SERIES
  ): ResolvedSystemTransformations {
    const memo = this._resolvedSystem;

    if (memo && memo.series === series && memo.state === this.state.transformations) {
      return memo.resolved;
    }

    const { system } = this._partitionTransformations();
    const prepend: SystemTransformation[] = [];
    const append: SystemTransformation[] = [];

    for (const origin of this._orderedOrigins(system)) {
      const concrete = system.get(origin);

      if (concrete) {
        prepend.push(...concrete.prepend);
        append.push(...concrete.append);
      }

      const supplied = this._resolveSupplier(this._suppliers.get(origin), series, origin);

      prepend.push(...(supplied.prepend ?? []).map((t) => toSystemTransformation(t, 'prepend', origin)));
      append.push(...(supplied.append ?? []).map((t) => toSystemTransformation(t, 'append', origin)));
    }

    const resolved = { prepend, append };

    this._resolvedSystem = { series, state: this.state.transformations, resolved };

    return resolved;
  }

  private _resolveSupplier(
    supplier: SystemTransformationsSupplier | undefined,
    series: DataFrame[],
    origin: TransformationOrigin
  ): ReturnType<SystemTransformationsSupplier> {
    if (!supplier) {
      return {};
    }

    try {
      return supplier({ series }) ?? {};
    } catch (err) {
      // A supplier is someone else's code running inside our data pipeline; contributing nothing is a far
      // better failure than erroring the stream and blanking the panel.
      console.error(`Error resolving system transformations for origin '${origin}': `, err);
      return {};
    }
  }

  /**
   * The transformations the pipeline should run for the given source frames, in prepend, user, append order.
   */
  private _effectiveTransformations(series: DataFrame[]): SceneDataTransformation[] {
    if (this._suppliers.size === 0) {
      // Without suppliers state already holds everything in pipeline order, so the common case stays free.
      return this.state.transformations;
    }

    const { prepend, append } = this.getResolvedSystemTransformations(series);
    const user = this.state.transformations.filter((transformation) => !isSystemTransformation(transformation));

    return [...prepend, ...user, ...append];
  }

  /**
   * Replaces the user configured transformations, keeping any system transformations in place around them.
   * Use this instead of setState({ transformations }) from a transformations editor or a React binding:
   * writing the array directly would drop the runtime transformations added via setSystemTransformations,
   * since they live in the same array.
   */
  public setUserTransformations(transformations: SceneDataTransformation[]) {
    const { system } = this._partitionTransformations();

    // Callers migrating off setState({ transformations }) may hand back the whole array, tagged entries
    // included. Those are owned by setSystemTransformations and get re-added from `system`, so drop them
    // instead of letting them sit in the user slot where the next partition would collect them again.
    const user = transformations.filter((transformation) => !isSystemTransformation(transformation));

    this._applyTransformations(this._combineTransformations(system, user));
  }

  /**
   * Splits the current transformations into the system ones, grouped by origin and position, and the user
   * configured ones.
   */
  private _partitionTransformations() {
    const system = new Map<TransformationOrigin, SystemTransformationGroup>();
    const user: SceneDataTransformation[] = [];

    for (const transformation of this.state.transformations) {
      if (isSystemTransformation(transformation)) {
        let group = system.get(transformation.origin);

        if (!group) {
          group = { prepend: [], append: [] };
          system.set(transformation.origin, group);
        }

        (transformation.position === 'append' ? group.append : group.prepend).push(transformation);
      } else {
        user.push(transformation);
      }
    }

    return { system, user };
  }

  /**
   * Registration order, then any origin that only exists in state - rehydrated from a save model, or written
   * by a setState that bypassed setSystemTransformations - in the order the array puts it.
   */
  private _orderedOrigins(system: Map<TransformationOrigin, SystemTransformationGroup>): TransformationOrigin[] {
    const origins = [...this._originOrder];

    for (const origin of system.keys()) {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    }

    return origins;
  }

  private _combineTransformations(
    system: Map<TransformationOrigin, SystemTransformationGroup>,
    user: SceneDataTransformation[]
  ): SceneDataTransformation[] {
    const prepend: SceneDataTransformation[] = [];
    const append: SceneDataTransformation[] = [];

    for (const origin of this._orderedOrigins(system)) {
      const group = system.get(origin);

      if (group) {
        prepend.push(...group.prepend);
        append.push(...group.append);
      }
    }

    return [...prepend, ...user, ...append];
  }

  private _applyTransformations(transformations: SceneDataTransformation[], force = false) {
    const changed = !haveEqualTransformations(transformations, this.state.transformations);

    if (!changed && !force) {
      return;
    }

    if (changed) {
      this.setState({ transformations });
    }

    // If not active yet the activation handler will run the transformations
    if (this.isActive) {
      this.reprocessTransformations();
    }
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
    }

    // Suppliers are runtime registrations rather than state, so cloning through the constructor leaves the
    // clone with none. Its first transform would then find an empty pipeline and hand on the source data
    // untransformed, overwriting the transformed data it was cloned with. Whoever registered them
    // re-registers on the clone's own activation and replaces these.
    clone['_suppliers'] = new Map(this._suppliers);
    clone['_originOrder'] = [...this._originOrder];

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
    const transformations = data ? this._effectiveTransformations(data.series) : [];

    if (transformations.length === 0 || !data) {
      // Transformations are asynchronous, so a pass started when there were some is likely still running.
      // Left subscribed it would complete after this and overwrite the passthrough with stale frames. Not
      // hoisted above the haveAlreadyTransformedData return below: there the data is unchanged, so letting
      // the in-flight pass finish is what we want.
      this._transformSub?.unsubscribe();

      this._prevDataFromSource = data;
      this.setState({ data });

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

    const interpolatedTransformations = this._interpolateVariablesInTransformationConfigs(data, transformations);

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
    transformations: SceneDataTransformation[]
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
