import { BusEventWithPayload } from '@grafana/data';

class SceneVariableValueChangedEvent extends BusEventWithPayload {
}
SceneVariableValueChangedEvent.type = "scene-variable-changed-value";
function isCustomVariableValue(value) {
  return typeof value === "object" && "formatter" in value;
}

export { SceneVariableValueChangedEvent, isCustomVariableValue };
//# sourceMappingURL=types.js.map
