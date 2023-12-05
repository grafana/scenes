import { BusEventWithPayload } from '@grafana/data';
import { VizPanel } from './VizPanel';

class VizPanelEvent extends BusEventWithPayload<{ origin: VizPanel }> {}

export class DescriptionShown extends VizPanelEvent {
  public static type = 'panel-description-shown';
}
export class StatusMessageClicked extends VizPanelEvent {
  public static type = 'panel-status-message-clicked';
}
export class CancelQueryClicked extends VizPanelEvent {
  public static type = 'panel-cancel-query-clicked';
}

export class MenuShown extends VizPanelEvent {
  public static type = 'menu-shown';
}

export const VizPanelEvents = { DescriptionShown, StatusMessageClicked, CancelQueryClicked, MenuShown };
