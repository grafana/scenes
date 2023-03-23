import { SceneObject } from '../../core/types';
import { SkipFormattingValue } from '../SkipFormattingValue';
import { SceneVariable, VariableValue } from '../types';
import { formatRegistry, FormatRegistryID, FormatVariable } from './formatRegistry';

export class UrlVariables implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name, type: 'url_variable' };
    this._sceneObject = sceneObject;
  }

  public getValue(fieldPath?: string | undefined): VariableValue | null | undefined {
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

  public getValueText?(fieldPath?: string | undefined): string {
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
