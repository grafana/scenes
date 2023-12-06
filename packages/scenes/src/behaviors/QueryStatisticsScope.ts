import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';

interface QueryStatisticsScopeState extends SceneObjectState {}

/**
 * This behavior will provide a cursor sync context within a scene.
 */

export class QueryStatisticsScope extends SceneObjectBase<QueryStatisticsScopeState> {
  public constructor(state: Partial<QueryStatisticsScopeState>) {
    super({
      ...state,
    });
  }
}
