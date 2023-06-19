import { MatcherConfig } from '@grafana/schema';
import { StandardFieldConfig, StandardFieldConfigInterface } from './types';

// Base class for standard field config overrides builder methods
export class StandardFieldConfigOverridesBuilder<T extends StandardFieldConfigOverridesBuilder<T>>
  implements StandardFieldConfigInterface<StandardFieldConfig, T, 'override'>
{
  protected _overrides: Array<{ matcher: MatcherConfig; properties: Array<{ id: string; value: unknown }> }> = [];

  public overrideColor(value: StandardFieldConfig['color']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'color', value });
    return this as unknown as T;
  }

  public overrideDecimals(value: StandardFieldConfig['decimals']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'decimals', value });
    return this as unknown as T;
  }

  public overrideDisplayName(value: StandardFieldConfig['displayName']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'displayName', value });
    return this as unknown as T;
  }

  public overrideFilterable(value: StandardFieldConfig['filterable']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'filterable', value });
    return this as unknown as T;
  }

  public overrideLinks(value: StandardFieldConfig['links']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'links', value });
    return this as unknown as T;
  }

  public overrideMappings(value: StandardFieldConfig['mappings']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'mappings', value });
    return this as unknown as T;
  }

  public overrideMax(value: StandardFieldConfig['max']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'max', value });
    return this as unknown as T;
  }

  public overrideMin(value: StandardFieldConfig['min']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'min', value });
    return this as unknown as T;
  }

  public overrideNoValue(value: StandardFieldConfig['noValue']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'noValue', value });
    return this as unknown as T;
  }

  public overrideThresholds(value: StandardFieldConfig['thresholds']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'thresholds', value });
    return this as unknown as T;
  }

  public overrideUnit(value: StandardFieldConfig['unit']): T {
    this._overrides[this._overrides.length - 1].properties.push({ id: 'unit', value });
    return this as unknown as T;
  }
}
