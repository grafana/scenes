import React from 'react';
import { LoadingState } from '@grafana/data';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { sceneGraph } from '../core/sceneGraph/index.js';

class SceneByFrameRepeater extends SceneObjectBase {
  constructor(state) {
    super(state);
    this.addActivationHandler(() => {
      const dataProvider = sceneGraph.getData(this);
      this._subs.add(
        dataProvider.subscribeToState((data) => {
          var _a;
          if (((_a = data.data) == null ? void 0 : _a.state) === LoadingState.Done) {
            this.performRepeat(data.data);
          }
        })
      );
      if (dataProvider.state.data) {
        this.performRepeat(dataProvider.state.data);
      }
    });
  }
  performRepeat(data) {
    const newChildren = [];
    for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
      const layoutChild = this.state.getLayoutChild(data, data.series[seriesIndex], seriesIndex);
      newChildren.push(layoutChild);
    }
    this.state.body.setState({ children: newChildren });
  }
}
SceneByFrameRepeater.Component = ({ model }) => {
  const { body } = model.useState();
  return /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  });
};

export { SceneByFrameRepeater };
//# sourceMappingURL=SceneByFrameRepeater.js.map
