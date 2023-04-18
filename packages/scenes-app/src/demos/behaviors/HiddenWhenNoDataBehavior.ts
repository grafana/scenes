import { SceneDataState, sceneGraph } from '@grafana/scenes';
import { HiddenLayoutItemBehavior } from './HiddenLayoutItemBehavior';

export class HiddenWhenNoDataBehavior extends HiddenLayoutItemBehavior {
  public constructor() {
    super({});

    this.addActivationHandler(() => {
      this._subs.add(sceneGraph.getData(this).subscribeToState(this._onData));
    });
  }

  private _onData = (data: SceneDataState) => {
    if (!data.data) {
      return;
    }

    if (data.data && data.data.series.length === 0) {
      this.setHidden();
      return;
    }

    this.setVisible();
  };
}
