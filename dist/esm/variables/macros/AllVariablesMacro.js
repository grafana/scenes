import { isCustomVariableValue } from '../types.js';
import { formatRegistry } from '../interpolation/formatRegistry.js';
import { SkipFormattingValue } from './types.js';
import { VariableFormatID } from '@grafana/schema';
import { MultiValueVariable } from '../variants/MultiValueVariable.js';
import { ALL_VARIABLE_VALUE } from '../constants.js';

class AllVariablesMacro {
  constructor(name, sceneObject) {
    this.state = { name, type: "url_variable" };
    this._sceneObject = sceneObject;
  }
  getValue() {
    const allVars = collectAllVariables(this._sceneObject);
    const format = formatRegistry.get(VariableFormatID.QueryParam);
    const params = [];
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
    return new SkipFormattingValue(params.join("&"));
  }
  getValueText() {
    return "";
  }
}
function collectAllVariables(sceneObject, record = {}) {
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

export { AllVariablesMacro };
//# sourceMappingURL=AllVariablesMacro.js.map
