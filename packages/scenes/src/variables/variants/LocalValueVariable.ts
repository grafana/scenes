import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';

export interface LocalValueVariableState extends SceneVariableState {
  value: VariableValue;
  text: VariableValue;

  // Indicate whether or not this variable is sourced from a multi-value variable.
  // Introduces for a backwards compatibility with the old variable system, to properly support interpolation in SQL data sources.
  isMulti?: boolean;
  includeAll?: boolean;
}

/**
 * This is a special type of variable that is used for repeating panels and layouts to create a local scoped value for a variable
 * that exists in a ancestor SceneVariableSet.
 */
export class LocalValueVariable
  extends SceneObjectBase<LocalValueVariableState>
  implements SceneVariable<LocalValueVariableState>
{
  public constructor(initialState: Omit<Partial<LocalValueVariableState>, 'isMulti' | 'includeAll'>) {
    super({
      type: 'system',
      value: '',
      text: '',
      name: '',
      isMulti: true,
      includeAll: true,
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

  /**
   * Checks the ancestor of our parent SceneVariableSet for loading state of a variable with the same name
   * This function is unit tested from SceneVariableSet tests.
   */
  public isAncestorLoading(): boolean {
    // Parent (SceneVariableSet) -> Parent (The object that has our parent set) -> Parent (scope we need to access our sets ancestor)
    const ancestorScope = this.parent?.parent?.parent;
    if (!ancestorScope) {
      throw new Error('LocalValueVariable requires a parent SceneVariableSet that has an ancestor SceneVariableSet');
    }

    const set = sceneGraph.getVariables(ancestorScope);
    const parentVar = sceneGraph.lookupVariable(this.state.name, ancestorScope);
    if (set && parentVar) {
      return set.isVariableLoadingOrWaitingToUpdate(parentVar);
    }

    return false;
  }

  public getAncestorVariable(): SceneVariable | null {
    // Parent (SceneVariableSet) -> Parent (The object that has our parent set) -> Parent (scope we need to access our sets ancestor)
    const ancestorScope = this.parent?.parent?.parent;
    if (!ancestorScope) {
      throw new Error('LocalValueVariable requires a parent SceneVariableSet that has an ancestor SceneVariableSet');
    }

    const parentVar = sceneGraph.lookupVariable(this.state.name, ancestorScope);
    if (!parentVar) {
      return null;
    }

    return parentVar;
  }
}
