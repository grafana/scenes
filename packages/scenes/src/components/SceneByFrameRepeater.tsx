import { LoadingState, PanelData, DataFrame } from '@grafana/data';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneLayout, SceneObject, SceneObjectState } from '../core/types';

interface SceneByFrameRepeaterState extends SceneObjectState {
  body: SceneLayout;
  getLayoutChild(data: PanelData, frame: DataFrame, frameIndex: number): SceneObject;
}

export class SceneByFrameRepeater extends SceneObjectBase<SceneByFrameRepeaterState> {
  public constructor(state: SceneByFrameRepeaterState) {
    super(state);

    this.addActivationHandler(() => {
      const dataProvider = sceneGraph.getData(this);

      this._subs.add(
        dataProvider.subscribeToState((data) => {
          if (data.data?.state === LoadingState.Done) {
            this.performRepeat(data.data);
          }
        })
      );

      if (dataProvider.state.data) {
        this.performRepeat(dataProvider.state.data);
      }
    });
  }

  private performRepeat(data: PanelData) {
    const newChildren: SceneObject[] = [];

    for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
      const layoutChild = this.state.getLayoutChild(data, data.series[seriesIndex], seriesIndex);
      newChildren.push(layoutChild);
    }

    this.state.body.setState({ children: newChildren });
  }

  public static Component = ({ model }: SceneComponentProps<SceneByFrameRepeater>) => {
    const { body } = model.useState();
    return <body.Component model={body} />;
  };
}
