import {
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

export interface SceneDataTransformerState extends SceneDataState {
  /**
   * Array of standard transformation configs and custom transform operators
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

  private haveAlreadyTransformedData(data: PanelData) {
    if (!this._prevDataFromSource) {
      return false;
    }

    if (data === this._prevDataFromSource) {
      return true;
    }

    const { series, annotations } = this._prevDataFromSource;

    if (data.series === series && data.annotations === annotations) {
      if (this.state.data && data.state !== this.state.data.state) {
        this.setState({ data: { ...this.state.data, state: data.state } });
      }
      return true;
    }

    return false;
  }

  private transform(data: PanelData | undefined, force = false) {
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

    let interpolatedTransformations = this._interpolateVariablesInTransformationConfigs(data);

    const seriesTransformations = interpolatedTransformations
      .filter((transformation) => {
        if ('options' in transformation || 'topic' in transformation) {
          return transformation.topic == null || transformation.topic === DataTopic.Series;
        }

        return true;
      })
      .map((transformation) => ('operator' in transformation ? transformation.operator : transformation));

    const annotationsTransformations = interpolatedTransformations
      .filter((transformation) => {
        if ('options' in transformation || 'topic' in transformation) {
          return transformation.topic === DataTopic.Annotations;
        }

        return false;
      })
      .map((transformation) => ('operator' in transformation ? transformation.operator : transformation));

    if (this._transformSub) {
      this._transformSub.unsubscribe();
    }

    const ctx = {
      interpolate: (value: string, scopedVars?: ScopedVars) => {
        return sceneGraph.interpolate(this, value, { ...data.request?.scopedVars, ...scopedVars });
      },
    };

    let streams = [transformDataFrame(seriesTransformations, data.series, ctx)];

    if (data.annotations && data.annotations.length > 0 && annotationsTransformations.length > 0) {
      streams.push(transformDataFrame(annotationsTransformations, data.annotations ?? []));
    }

    this._transformSub = forkJoin(streams)
      .pipe(
        map((values) => {
          const transformedSeries = values[0];
          const transformedAnnotations = values[1];

          return {
            ...data,
            series: transformedSeries,
            annotations: transformedAnnotations ?? data.annotations,
          };
        }),
        catchError((err) => {
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

    const onlyObjects = transformations.every((t) => typeof t === 'object');

    // If all transformations are config object we can interpolate them all at once
    if (onlyObjects) {
      return JSON.parse(sceneGraph.interpolate(this, JSON.stringify(transformations), data.request?.scopedVars));
    }

    return transformations.map((t) => {
      return typeof t === 'object'
        ? JSON.parse(sceneGraph.interpolate(this, JSON.stringify(t), data.request?.scopedVars))
        : t;
    });
  }
}
