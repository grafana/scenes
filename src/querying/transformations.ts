import { BusEventBase, DataTransformerConfig, PanelData, transformDataFrame } from '@grafana/data';
import { map, Observable, of } from 'rxjs';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CustomTransformOperator, SceneObject, SceneObjectStatePlain } from '../core/types';

export interface SceneQueryRunnerDataTransformer extends SceneObject {
  transform(data: PanelData): Observable<PanelData>;
}

export class ReprocessTransformationsEvent extends BusEventBase {
  public static readonly type = 'reprocess-transformations';
}

export interface DefaultQueryRunnerDataTransformerState extends SceneObjectStatePlain {
  // Array of standard transformation configs and custom transform operators
  transformations?: Array<DataTransformerConfig | CustomTransformOperator>;
}

export class DefaultQueryRunnerDataTransformer
  extends SceneObjectBase<DefaultQueryRunnerDataTransformerState>
  implements SceneQueryRunnerDataTransformer
{
  // TODO add variable dependency config

  // Should this automatically trigger ReprocessTransformationsEvent on state change?

  public transform(data: PanelData): Observable<PanelData> {
    const transformations = this.state.transformations || [];

    if (transformations.length === 0) {
      return of(data);
    }

    const ctx = {
      interpolate: (value: string) => {
        return sceneGraph.interpolate(this, value, data.request?.scopedVars);
      },
    };

    return transformDataFrame(transformations, data.series, ctx).pipe(map((series) => ({ ...data, series })));
  }
}
