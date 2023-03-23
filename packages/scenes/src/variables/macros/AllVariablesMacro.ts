import { SceneObject } from '../../core/types';
import { SceneVariable, VariableValueCustom } from '../types';
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

      if (value) {
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
class SkipFormattingValue implements VariableValueCustom {
  public constructor(private _value: string) {}

  public format(): string {
    return this._value;
  }
}
