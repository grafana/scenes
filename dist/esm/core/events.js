import { BusEventWithPayload } from '@grafana/data';

class SceneObjectStateChangedEvent extends BusEventWithPayload {
}
SceneObjectStateChangedEvent.type = "scene-object-state-change";
class UserActionEvent extends BusEventWithPayload {
}
UserActionEvent.type = "scene-object-user-action";

export { SceneObjectStateChangedEvent, UserActionEvent };
//# sourceMappingURL=events.js.map
