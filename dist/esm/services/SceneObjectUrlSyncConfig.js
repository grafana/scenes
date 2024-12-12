class SceneObjectUrlSyncConfig {
  constructor(_sceneObject, _options) {
    this._sceneObject = _sceneObject;
    this._nextChangeShouldAddHistoryStep = false;
    this._keys = _options.keys;
  }
  getKeys() {
    if (typeof this._keys === "function") {
      return this._keys();
    }
    return this._keys;
  }
  getUrlState() {
    return this._sceneObject.getUrlState();
  }
  updateFromUrl(values) {
    this._sceneObject.updateFromUrl(values);
  }
  performBrowserHistoryAction(callback) {
    this._nextChangeShouldAddHistoryStep = true;
    callback();
    this._nextChangeShouldAddHistoryStep = false;
  }
  shouldCreateHistoryStep(values) {
    return this._nextChangeShouldAddHistoryStep;
  }
}

export { SceneObjectUrlSyncConfig };
//# sourceMappingURL=SceneObjectUrlSyncConfig.js.map
