import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';

export interface LocalValueVariableState extends SceneVariableState {
  value: VariableValue;
  text: VariableValue;
}

/**
 * This is a special type of variable that is used for repeating panels and layouts to create a local scoped value for a variable
 * that exists in a ancestor SceneVariableSet.
 */
export class LocalValueVariable
  extends SceneObjectBase<LocalValueVariableState>
  implements SceneVariable<LocalValueVariableState>
{
  public constructor(initialState: Partial<LocalValueVariableState>) {
    super({
      type: 'system',
      value: '',
      text: '',
      name: '',
      ...initialState,
      skipUrlSync: true,
    });
  }

  public getValue(): VariableValue {
    return this.state.value;
  }

  public getValueText(): string {
    return this.state.text.toString();
  }

  public isAncestorLoading(): boolean {
    // Parent (SceneVariableSet) -> Parent (The object that has our parent set) -> Parent (scope we need to access our sets ancestor)
    const ancestorScope = this.parent?.parent?.parent;
    if (!ancestorScope) {
      throw new Error('LocalValueVariable requires a parent SceneVariableSet that has an ancestor SceneVariableSet');
    }

    //
    const set = sceneGraph.getVariables(ancestorScope);
    const parentVar = sceneGraph.lookupVariable(this.state.name, ancestorScope);
    if (set && parentVar) {
      return set.isVariableLoadingOrWaitingToUpdate(parentVar);
    }

    throw new Error('LocalValueVariable requires a parent SceneVariableSet that has an ancestor SceneVariableSet');
  }
}
