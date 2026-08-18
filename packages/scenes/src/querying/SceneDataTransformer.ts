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

export type SceneDataTransformation =
  | (DataTransformerConfig & { origin?: TransformationOrigin; position?: SystemTransformationPosition })
  | CustomTransformerDefinition;

export interface SceneDataTransformerState extends SceneDataState {
  /**
   * Array of standard transformation configs and custom transform operators.
   * Entries with origin 'system' are runtime transformations added programmatically via
   * setSystemTransformations. They are combined with the user configured ones but should not be
   * persisted or shown in the transformations editor (filter them out with isSystemTransformation).
   */
  transformations: SceneDataTransformation[];
}

/**
 * Returns true for transformations added via SceneDataTransformer.setSystemTransformations,
 * regardless of their origin ('system', 'url', ...).
 * Use this to filter out runtime transformations when persisting or editing user transformations.
 */
export function isSystemTransformation(
  transformation: SceneDataTransformation
): transformation is Exclude<SceneDataTransformation, CustomTransformOperator> {
  return typeof transformation === 'object' && 'origin' in transformation && transformation.origin != null;
}

function toSystemTransformation(
  transformation: DataTransformerConfig | CustomTransformerDefinition,
  position: SystemTransformationPosition,
  origin: TransformationOrigin
): SceneDataTransformation {
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
    this.transform(this.getSourceData().state.data, true);
  }

  /**
   * Sets the system (runtime) transformations for the given origin and combines them with the user
   * configured ones. Prepended transformations run before the user transformations, appended ones after.
   * Each provided transformation is tagged with the origin (default 'system'). Previous transformations
   * with the same origin are replaced rather than appended, so repeated calls never accumulate
   * duplicates; transformations from other origins are preserved.
   *
   * Repeated calls only skip re-running the pipeline when the resulting transformations are equal to the
   * current ones. Custom transform operators are functions and so compare by reference: a caller that
   * builds them inline would re-run the pipeline and emit new data on every call, which loops if it
   * re-applies on data change. Give such operators a stable `key` to declare identity instead - matching
   * keys make the operator reference irrelevant, and changing the key signals a real change.
   *
   * Resulting pipeline order: system prepend, url prepend, user, url append, system append -
   * panel provided (system) transformations wrap everything, url provided ones sit closest
   * to the user configured transformations.
   */
  public setSystemTransformations({
    prepend = [],
    append = [],
    origin = 'system',
  }: {
    prepend?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    append?: Array<DataTransformerConfig | CustomTransformerDefinition>;
    origin?: TransformationOrigin;
  }) {
    const groups: Record<
      TransformationOrigin,
      { prepend: SceneDataTransformation[]; append: SceneDataTransformation[] }
    > = {
      system: { prepend: [], append: [] },
      url: { prepend: [], append: [] },
    };
    const userTransformations: SceneDataTransformation[] = [];

    for (const transformation of this.state.transformations) {
      if (isSystemTransformation(transformation) && transformation.origin !== origin) {
        const group = groups[transformation.origin ?? 'system'];
        (transformation.position === 'append' ? group.append : group.prepend).push(transformation);
      } else if (!isSystemTransformation(transformation)) {
        userTransformations.push(transformation);
      }
    }

    groups[origin] = {
      prepend: prepend.map((t) => toSystemTransformation(t, 'prepend', origin)),
      append: append.map((t) => toSystemTransformation(t, 'append', origin)),
    };

    const transformations = [
      ...groups.system.prepend,
      ...groups.url.prepend,
      ...userTransformations,
      ...groups.url.append,
      ...groups.system.append,
    ];

    if (haveEqualTransformations(transformations, this.state.transformations)) {
      return;
    }

    this.setState({ transformations });

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

    if (this.state.transformations.length === 0 || !data) {
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
      const transformationTypes = this.state.transformations
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
      const metrics = this._calculateTransformationMetrics(data, this.state.transformations);

      // Start the DataProcessing phase with centralized logging - get end callback
      endTransformCallback = profiler.onDataTransformStart(timestamp, transformationId, metrics);
    }

    const interpolatedTransformations = this._interpolateVariablesInTransformationConfigs(data);

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
    data: PanelData
  ): Array<DataTransformerConfig | CustomTransformerDefinition> {
    const transformations = this.state.transformations;

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
