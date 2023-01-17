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

interface RepeatOptions extends SceneObjectStatePlain {
  body: SceneObject<SceneLayoutState>;
  getLayoutChild(data: PanelData, frame: DataFrame, frameIndex: number): SceneLayoutChild;
}

export class SceneByFrameRepeater extends SceneObjectBase<RepeatOptions> {
  public activate(): void {
    super.activate();

    this._subs.add(
      sceneGraph.getData(this).subscribeToState({
        next: (data) => {
          if (data.data?.state === LoadingState.Done) {
            this.performRepeat(data.data);
          }
        },
      })
    );
  }

  private performRepeat(data: PanelData) {
    const newChildren: SceneLayoutChild[] = [];

    for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
      const layoutChild = this.state.getLayoutChild(data, data.series[seriesIndex], seriesIndex);
      newChildren.push(layoutChild);
    }

    this.state.body.setState({ children: newChildren });
  }

  public static Component = ({ model, isEditing }: SceneComponentProps<SceneByFrameRepeater>) => {
    const { body } = model.useState();
    return <body.Component model={body} isEditing={isEditing} />;
  };
}
