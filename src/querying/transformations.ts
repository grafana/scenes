import { DataTransformerConfig, PanelData, transformDataFrame } from '@grafana/data';
import { map, of, Unsubscribable } from 'rxjs';
import { SceneDataNodeState } from '../core/SceneDataNode';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CustomTransformOperator, SceneQueryRunnerInterface } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

export interface QueryRunnerWithTransformationsState extends SceneDataNodeState {
  // Array of standard transformation configs and custom transform operators
  transformations: Array<DataTransformerConfig | CustomTransformOperator>;
  queryRunner: SceneQueryRunnerInterface;
}

export class QueryRunnerWithTransformations
  extends SceneObjectBase<QueryRunnerWithTransformationsState>
  implements SceneQueryRunnerInterface
{
  protected _variableDependency: VariableDependencyConfig<QueryRunnerWithTransformationsState> =
    new VariableDependencyConfig(this, {
      statePaths: ['transformations'],
      onReferencedVariableValueChanged: () => this.reprocessTransformations(),
    });

  private _transformSub?: Unsubscribable;

  public activate(): void {
    super.activate();

    const { queryRunner } = this.state;

    queryRunner.activate();

    this._subs.add(
      queryRunner.subscribeToState({
        next: (state) => this.transform(state.data),
      })
    );
  }

  public deactivate(): void {
    super.deactivate();
    this.state.queryRunner.deactivate();
  }

  public setContainerWidth(width: number) {
    this.state.queryRunner.setContainerWidth(width);
  }

  public reprocessTransformations() {
    this.transform(this.state.queryRunner.state.data);
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
