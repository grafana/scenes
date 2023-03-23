import { SceneObject } from '../../core/types';
import { isCustomVariableValue, SceneVariable, CustomVariableValue } from '../types';
import { formatRegistry, FormatRegistryID, FormatVariable } from '../interpolation/formatRegistry';

export class AllVariablesMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name, type: 'url_variable' };
    this._sceneObject = sceneObject;
  }

  public getValue(): SkipFormattingValue {
    const allVars = collectAllVariables(this._sceneObject);
    const format = formatRegistry.get(FormatRegistryID.queryParam);
    const params: string[] = [];

    for (const name of Object.keys(allVars)) {
      const variable = allVars[name];
      const value = variable.getValue();

      if (!value) {
        continue;
      }

      if (isCustomVariableValue(value)) {
        params.push(value.formatter(FormatRegistryID.queryParam));
      } else {
        params.push(format.formatter(value, [], variable));
      }
    }

    return new SkipFormattingValue(params.join('&'));
  }

  public getValueText?(): string {
    return '';
  }
}

function collectAllVariables(
  sceneObject: SceneObject,
  record: Record<string, SceneVariable> = {}
): Record<string, SceneVariable> {
  if (sceneObject.state.$variables) {
    for (const variable of sceneObject.state.$variables.state.variables) {
      if (variable.state.skipUrlSync) {
        continue;
      }

      if (!record[variable.state.name]) {
        record[variable.state.name] = variable;
      }
    }
  }

  if (sceneObject.parent) {
    collectAllVariables(sceneObject.parent, record);
  }

  return record;
}

/**
 * The sceneInterpolator will detect if getValue returns VariableValueCustom and will skip the normal formatting
 * This is useful as otherwise we would url encode macros like $__all_variables twice.
 */
class SkipFormattingValue implements CustomVariableValue {
  public constructor(private _value: string) {}

  public formatter(): string {
    return this._value;
  }
}
