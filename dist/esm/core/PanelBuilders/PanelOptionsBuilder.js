import { cloneDeep, merge } from 'lodash';

class PanelOptionsBuilder {
  constructor(defaultOptions) {
    this.defaultOptions = defaultOptions;
    this._options = {};
    this.setDefaults();
  }
  setDefaults() {
    this._options = this.defaultOptions ? cloneDeep(this.defaultOptions()) : {};
  }
  setOption(id, value) {
    this._options = merge(this._options, { [id]: value });
    return this;
  }
  build() {
    return this._options;
  }
}

export { PanelOptionsBuilder };
//# sourceMappingURL=PanelOptionsBuilder.js.map
