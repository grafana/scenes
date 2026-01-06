import { property } from 'lodash';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneVariable, SceneVariableState, VariableValue, VariableValueOptionProperties } from '../types';
import { FieldAccessorCache } from './MultiValueVariable';

export interface LocalValueVariableState extends SceneVariableState {
  value: VariableValue;
  text: VariableValue;
  properties?: VariableValueOptionProperties;

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
  private static fieldAccessorCache: FieldAccessorCache = {};

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

  public getValue(fieldPath?: string): VariableValue {
    if (fieldPath != null && this.state.properties) {
      return this.getFieldAccessor(fieldPath)(this.state.properties);
    }
    return this.state.value;
  }

  private getFieldAccessor(fieldPath: string) {
    const accessor = LocalValueVariable.fieldAccessorCache[fieldPath];
    if (accessor) {
      return accessor;
    }
    return (LocalValueVariable.fieldAccessorCache[fieldPath] = property(fieldPath));
  }

  public getValueText(fieldPath?: string): string {
    if (fieldPath && this.state.properties) {
      const value = this.getFieldAccessor(fieldPath)(this.state.properties);
      if (value != null) {
        return String(value);
      }
    }

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
}
