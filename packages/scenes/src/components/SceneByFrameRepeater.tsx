import React from 'react';

import { LoadingState, PanelData, DataFrame } from '@grafana/data';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';

interface SceneByFrameRepeaterState extends SceneObjectState {
  body: SceneFlexLayout;
  getLayoutChild(data: PanelData, frame: DataFrame, frameIndex: number): SceneFlexItem;
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
    const newChildren: SceneFlexItem[] = [];

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
