import { FieldMatcherID } from '@grafana/data';
import { getCompareSeriesRefId } from '../../utils/getCompareSeriesRefId.js';
import { StandardFieldConfigOverridesBuilder } from './StandardFieldConfigBuilders.js';

class FieldConfigOverridesBuilder extends StandardFieldConfigOverridesBuilder {
  match(matcher) {
    this._overrides.push({ matcher, properties: [] });
    return this;
  }
  matchFieldsWithName(name) {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byName,
        options: name
      },
      properties: []
    });
    return this;
  }
  matchFieldsWithNameByRegex(regex) {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byRegexp,
        options: regex
      },
      properties: []
    });
    return this;
  }
  matchFieldsByType(fieldType) {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byType,
        options: fieldType
      },
      properties: []
    });
    return this;
  }
  matchFieldsByQuery(refId) {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byFrameRefID,
        options: refId
      },
      properties: []
    });
    return this;
  }
  matchFieldsByValue(options) {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byValue,
        options
      },
      properties: []
    });
    return this;
  }
  matchComparisonQuery(refId) {
    return this.matchFieldsByQuery(getCompareSeriesRefId(refId));
  }
  overrideCustomFieldConfig(id, value) {
    const _id = `custom.${String(id)}`;
    const last = this._overrides[this._overrides.length - 1];
    last.properties.push({ id: _id, value });
    return this;
  }
  build() {
    return this._overrides;
  }
}

export { FieldConfigOverridesBuilder };
//# sourceMappingURL=FieldConfigOverridesBuilder.js.map
