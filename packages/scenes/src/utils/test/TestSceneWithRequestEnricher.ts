import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectState, DataRequestEnricher, SceneObject } from '../../core/types';

export class TestSceneWithRequestEnricher extends SceneObjectBase<SceneObjectState> implements DataRequestEnricher {
  public enrichDataRequest(_: SceneObject) {
    return { app: 'enriched' };
  }
}
