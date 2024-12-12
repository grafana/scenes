import { SceneObjectBase } from '../core/SceneObjectBase.js';

class DataProviderProxy extends SceneObjectBase {
  constructor(state) {
    super({
      source: state.source,
      data: state.source.resolve().state.data
    });
    this.addActivationHandler(() => {
      this._subs.add(
        this.state.source.resolve().subscribeToState((newState, oldState) => {
          if (newState.data !== oldState.data) {
            this.setState({ data: newState.data });
          }
        })
      );
    });
  }
  setContainerWidth(width) {
    var _a, _b;
    (_b = (_a = this.state.source.resolve()).setContainerWidth) == null ? void 0 : _b.call(_a, width);
  }
  isDataReadyToDisplay() {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.state.source.resolve()).isDataReadyToDisplay) == null ? void 0 : _b.call(_a)) != null ? _c : true;
  }
  cancelQuery() {
    var _a, _b;
    (_b = (_a = this.state.source.resolve()).cancelQuery) == null ? void 0 : _b.call(_a);
  }
  getResultsStream() {
    return this.state.source.resolve().getResultsStream();
  }
}

export { DataProviderProxy };
//# sourceMappingURL=DataProviderProxy.js.map
