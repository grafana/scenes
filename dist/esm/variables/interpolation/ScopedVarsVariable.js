import { getFieldAccessor } from './fieldAccessorCache.js';

class ScopedVarsVariable {
  constructor(name, value) {
    this.state = { name, value, type: "scopedvar" };
  }
  getValue(fieldPath) {
    let { value } = this.state;
    let realValue = value.value;
    if (fieldPath) {
      realValue = getFieldAccessor(fieldPath)(value.value);
    } else {
      realValue = value.value;
    }
    if (realValue === "string" || realValue === "number" || realValue === "boolean") {
      return realValue;
    }
    return String(realValue);
  }
  getValueText() {
    const { value } = this.state;
    if (value.text != null) {
      return String(value.text);
    }
    return String(value);
  }
}
let scopedVarsVariable;
function getSceneVariableForScopedVar(name, value) {
  if (!scopedVarsVariable) {
    scopedVarsVariable = new ScopedVarsVariable(name, value);
  } else {
    scopedVarsVariable.state.name = name;
    scopedVarsVariable.state.value = value;
  }
  return scopedVarsVariable;
}

export { ScopedVarsVariable, getSceneVariableForScopedVar };
//# sourceMappingURL=ScopedVarsVariable.js.map
