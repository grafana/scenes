import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectState, DataRequestEnricher, FiltersRequestEnricher, SceneObject } from '../../core/types';

export class TestSceneWithRequestEnricher
  extends SceneObjectBase<SceneObjectState>
  implements DataRequestEnricher, FiltersRequestEnricher
{
  public enrichDataRequest(_: SceneObject) {
    return { app: 'enriched' };
  }

  public enrichFiltersRequest(_: SceneObject) {
    return { app: 'enriched' };
  }
}
