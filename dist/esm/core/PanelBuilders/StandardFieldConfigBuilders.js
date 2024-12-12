class StandardFieldConfigOverridesBuilder {
  constructor() {
    this._overrides = [];
  }
  overrideColor(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "color", value });
    return this;
  }
  overrideDecimals(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "decimals", value });
    return this;
  }
  overrideDisplayName(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "displayName", value });
    return this;
  }
  overrideFilterable(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "filterable", value });
    return this;
  }
  overrideLinks(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "links", value });
    return this;
  }
  overrideMappings(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "mappings", value });
    return this;
  }
  overrideMax(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "max", value });
    return this;
  }
  overrideMin(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "min", value });
    return this;
  }
  overrideNoValue(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "noValue", value });
    return this;
  }
  overrideThresholds(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "thresholds", value });
    return this;
  }
  overrideUnit(value) {
    this._overrides[this._overrides.length - 1].properties.push({ id: "unit", value });
    return this;
  }
}

export { StandardFieldConfigOverridesBuilder };
//# sourceMappingURL=StandardFieldConfigBuilders.js.map
