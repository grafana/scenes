import { DataTransformerConfig, PanelData, transformDataFrame } from '@grafana/data';
import { map, Unsubscribable } from 'rxjs';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CustomTransformOperator, SceneDataProvider, SceneDataState } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

export interface SceneDataTransformerState extends SceneDataState {
  /**
   * Array of standard transformation configs and custom transform operators
   */
  transformations: Array<DataTransformerConfig | CustomTransformOperator>;
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
    this.transform(this.getSourceData().state.data);
  }

  public cancelQuery() {
    this.getSourceData().cancelQuery?.();
  }

  private transform(data: PanelData | undefined) {
    const transformations = this.state.transformations || [];

    if (transformations.length === 0 || !data) {
      this.setState({ data });
      return;
    }

    if (this._transformSub) {
      this._transformSub.unsubscribe();
    }

    const ctx = {
      interpolate: (value: string) => {
        return sceneGraph.interpolate(this, value, data.request?.scopedVars);
      },
    };

    this._transformSub = transformDataFrame(transformations, data.series, ctx)
      .pipe(map((series) => ({ ...data, series })))
      .subscribe((data) => this.setState({ data }));
  }
}
