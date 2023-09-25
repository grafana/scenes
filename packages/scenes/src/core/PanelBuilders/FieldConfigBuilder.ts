import { FieldConfigSource } from '@grafana/data';
import { cloneDeep, merge } from 'lodash';
import { DeepPartial } from '../types';
import { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder';
import { StandardFieldConfig, StandardFieldConfigInterface } from './types';

export class FieldConfigBuilder<TFieldConfig extends {}>
  implements StandardFieldConfigInterface<StandardFieldConfig, FieldConfigBuilder<TFieldConfig>, 'set'>
{
  private _fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>> = {
    defaults: {},
    overrides: [],
  };
  private _overridesBuilder = new FieldConfigOverridesBuilder<TFieldConfig>();

  public constructor(private defaultFieldConfig?: () => TFieldConfig) {
    this.setDefaults();
  }

  private setDefaults() {
    const fieldConfig: FieldConfigSource<TFieldConfig> = {
      defaults: {
        custom: this.defaultFieldConfig ? cloneDeep(this.defaultFieldConfig()) : ({} as TFieldConfig),
      }, // use field config factory that will provide default field config
      overrides: [],
    };

    this._fieldConfig = fieldConfig;
  }
  /**
   * Set color.
   */
  public setColor(color: StandardFieldConfig['color']): this {
    return this.setFieldConfigDefaults('color', color);
  }

  /**
   * Set number of decimals to show.
   */
  public setDecimals(decimals: StandardFieldConfig['decimals']): this {
    return this.setFieldConfigDefaults('decimals', decimals);
  }

  /**
   * Set field display name.
   */
  public setDisplayName(displayName: StandardFieldConfig['displayName']): this {
    return this.setFieldConfigDefaults('displayName', displayName);
  }

  /**
   * Set the standard field config property filterable.
   */
  public setFilterable(filterable: StandardFieldConfig['filterable']): this {
    return this.setFieldConfigDefaults('filterable', filterable);
  }

  /**
   * Set data links.
   */
  public setLinks(links: StandardFieldConfig['links']): this {
    return this.setFieldConfigDefaults('links', links);
  }

  /**
   * Set value mappings.
   */
  public setMappings(mappings: StandardFieldConfig['mappings']): this {
    return this.setFieldConfigDefaults('mappings', mappings);
  }

  /**
   * Set the standard field config property max.
   */
  public setMax(max: StandardFieldConfig['max']): this {
    return this.setFieldConfigDefaults('max', max);
  }

  /**
   * Set the standard field config property min.
   */
  public setMin(min: StandardFieldConfig['min']): this {
    return this.setFieldConfigDefaults('min', min);
  }

  /**
   * Set the standard field config property noValue.
   */
  public setNoValue(noValue: StandardFieldConfig['noValue']): this {
    return this.setFieldConfigDefaults('noValue', noValue);
  }

  /**
   * Set the standard field config property thresholds.
   */
  public setThresholds(thresholds: StandardFieldConfig['thresholds']): this {
    return this.setFieldConfigDefaults('thresholds', thresholds);
  }

  /**
   * Set the standard field config property unit.
   */
  public setUnit(unit: StandardFieldConfig['unit']): this {
    return this.setFieldConfigDefaults('unit', unit);
  }

  /**
   * Set an individual custom field config value. This will merge the value with the existing custom field config.
   */
  public setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._fieldConfig.defaults = {
      ...this._fieldConfig.defaults,
      custom: merge(this._fieldConfig.defaults.custom, { [id]: value }),
    };

    return this;
  }

  /**
   * Configure overrides for the field config. This will merge the overrides with the existing overrides.
   */
  public setOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this {
    builder(this._overridesBuilder);
    return this;
  }

  public setFieldConfigDefaults<T extends keyof StandardFieldConfig>(key: T, value: StandardFieldConfig[T]) {
    this._fieldConfig.defaults = {
      ...this._fieldConfig.defaults,
      [key]: value,
    };
    return this;
  }

  public build() {
    return {
      defaults: this._fieldConfig.defaults,
      overrides: this._overridesBuilder.build(),
    };
  }
}
