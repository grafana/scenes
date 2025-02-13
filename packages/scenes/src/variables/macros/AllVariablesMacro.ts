import { SceneObject } from '../../core/types';
import { isCustomVariableValue, SceneVariable } from '../types';
import { formatRegistry, FormatVariable } from '../interpolation/formatRegistry';
import { SkipFormattingValue } from './types';
import { VariableFormatID } from '@grafana/schema';
import { MultiValueVariable } from '../variants/MultiValueVariable';
import { ALL_VARIABLE_VALUE } from '../constants';

export class AllVariablesMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name, type: 'url_variable' };
    this._sceneObject = sceneObject;
  }

  public getValue(): SkipFormattingValue {
    const allVars = collectAllVariables(this._sceneObject);
    const format = formatRegistry.get(VariableFormatID.QueryParam);
    const params: string[] = [];

    for (const name of Object.keys(allVars)) {
      const variable = allVars[name];

      if (variable instanceof MultiValueVariable && variable.hasAllValue() && !variable.state.allValue) {
        params.push(format.formatter(ALL_VARIABLE_VALUE, [], variable));
        continue;
      }

      const value = variable.getValue();

      if (!value) {
        continue;
      }

      if (isCustomVariableValue(value)) {
        params.push(value.formatter(VariableFormatID.QueryParam));
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
