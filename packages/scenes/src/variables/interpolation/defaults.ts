import { SceneDataNode } from '../../core/SceneDataNode';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneVariable, SceneVariables, SceneVariableSetState, SceneVariableState } from '../types';

export const EmptyDataNode = new SceneDataNode();
export const DefaultTimeRange = new SceneTimeRange();

/**
 * Since this is used from sceneGraph.getVariables we cannot reference SceneVariableSet here as it would create a circular reference
 */
export class EmptyVariableSetImpl extends SceneObjectBase<SceneVariableSetState> implements SceneVariables {
  public constructor() {
    super({ variables: [] });
  }

  public getByName(name: string): SceneVariable<SceneVariableState> | undefined {
    return undefined;
  }

  public isVariableLoadingOrWaitingToUpdate(variable: SceneVariable<SceneVariableState>): boolean {
    return false;
  }
}

export const EmptyVariableSet = new EmptyVariableSetImpl();
