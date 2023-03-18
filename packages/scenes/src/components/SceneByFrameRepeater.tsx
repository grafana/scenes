import React from 'react';

import { LoadingState, PanelData, DataFrame } from '@grafana/data';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import {
  SceneComponentProps,
  SceneObject,
  SceneObjectStatePlain,
  SceneLayoutState,
  SceneLayoutChild,
} from '../core/types';

interface SceneByFrameRepeaterState extends SceneObjectStatePlain {
  body: SceneObject<SceneLayoutState>;
  getLayoutChild(data: PanelData, frame: DataFrame, frameIndex: number): SceneLayoutChild;
}

export class SceneByFrameRepeater extends SceneObjectBase<SceneByFrameRepeaterState> {
  public constructor(state: SceneByFrameRepeaterState) {
    super(state);

    this.addActivationHandler(() => {
      this._subs.add(
        sceneGraph.getData(this).subscribeToState((data) => {
          if (data.data?.state === LoadingState.Done) {
            this.performRepeat(data.data);
          }
        })
      );
    });
  }

  private performRepeat(data: PanelData) {
    const newChildren: SceneLayoutChild[] = [];

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
