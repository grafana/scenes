import { DataTransformerConfig, PanelData, transformDataFrame } from '@grafana/data';
import { map, Unsubscribable } from 'rxjs';
import { SceneDataNodeState } from '../core/SceneDataNode';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CustomTransformOperator, SceneDataProvider } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

export interface SceneDataTransformerState extends SceneDataNodeState {
  // Array of standard transformation configs and custom transform operators
  transformations: Array<DataTransformerConfig | CustomTransformOperator>;
}

export class SceneDataTransformer extends SceneObjectBase<SceneDataTransformerState> implements SceneDataProvider {
  protected _variableDependency: VariableDependencyConfig<SceneDataTransformerState> = new VariableDependencyConfig(
    this,
    {
      statePaths: ['transformations'],
      onReferencedVariableValueChanged: () => this.reprocessTransformations(),
    }
  );

  private _transformSub?: Unsubscribable;

  public activate(): void {
    super.activate();

    const sourceData = this.getSourceData();

    this._subs.add(
      sourceData.subscribeToState({
        next: (state) => this.transform(state.data),
      })
    );

    if (sourceData.state.data) {
      this.transform(sourceData.state.data);
    }
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

  public reprocessTransformations() {
    this.transform(this.getSourceData().state.data);
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
