import { DeepPartial } from '../types';
import { FieldConfigBuilder } from './FieldConfigBuilder';
import { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder';
import { PanelOptionsBuilder } from './PanelOptionsBuilder';
import { StandardFieldConfig, StandardFieldConfigInterface, VizConfig } from './types';

export class VizConfigBuilder<TOptions extends {}, TFieldConfig extends {}>
  implements StandardFieldConfigInterface<StandardFieldConfig, VizConfigBuilder<TOptions, TFieldConfig>, 'set'>
{
  private _fieldConfigBuilder: FieldConfigBuilder<TFieldConfig>;
  private _panelOptionsBuilder: PanelOptionsBuilder<TOptions>;
  private _pluginId: string;
  private _pluginVersion: string;

  public constructor(
    pluginId: string,
    pluginVersion: string,
    defaultOptions?: () => Partial<TOptions>,
    defaultFieldConfig?: () => TFieldConfig
  ) {
    this._pluginId = pluginId;
    this._pluginVersion = pluginVersion;
    this._fieldConfigBuilder = new FieldConfigBuilder(defaultFieldConfig);
    this._panelOptionsBuilder = new PanelOptionsBuilder(defaultOptions);
  }

  /**
   * Set color.
   */
  public setColor(color: StandardFieldConfig['color']): this {
    this._fieldConfigBuilder.setColor(color);
    return this;
  }

  /**
   * Set number of decimals to show.
   */
  public setDecimals(decimals: StandardFieldConfig['decimals']): this {
    this._fieldConfigBuilder.setDecimals(decimals);
    return this;
  }

  /**
   * Set field display name.
   */
  public setDisplayName(displayName: StandardFieldConfig['displayName']): this {
    this._fieldConfigBuilder.setDisplayName(displayName);
    return this;
  }

  /**
   * Set the standard field config property filterable.
   */
  public setFilterable(filterable: StandardFieldConfig['filterable']): this {
    this._fieldConfigBuilder.setFilterable(filterable);
    return this;
  }

  /**
   * Set data links.
   */
  public setLinks(links: StandardFieldConfig['links']): this {
    this._fieldConfigBuilder.setLinks(links);
    return this;
  }

  /**
   * Set value mappings.
   */
  public setMappings(mappings: StandardFieldConfig['mappings']): this {
    this._fieldConfigBuilder.setMappings(mappings);
    return this;
  }

  /**
   * Set the standard field config property max.
   */
  public setMax(max: StandardFieldConfig['max']): this {
    this._fieldConfigBuilder.setMax(max);
    return this;
  }

  /**
   * Set the standard field config property min.
   */
  public setMin(min: StandardFieldConfig['min']): this {
    this._fieldConfigBuilder.setMin(min);
    return this;
  }

  /**
   * Set the standard field config property noValue.
   */
  public setNoValue(noValue: StandardFieldConfig['noValue']): this {
    this._fieldConfigBuilder.setNoValue(noValue);
    return this;
  }

  /**
   * Set the standard field config property thresholds.
   */
  public setThresholds(thresholds: StandardFieldConfig['thresholds']): this {
    this._fieldConfigBuilder.setThresholds(thresholds);
    return this;
  }

  /**
   * Set the standard field config property unit.
   */
  public setUnit(unit: StandardFieldConfig['unit']): this {
    this._fieldConfigBuilder.setUnit(unit);
    return this;
  }

  public setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._fieldConfigBuilder.setCustomFieldConfig(id, value);
    return this;
  }

  public setOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this {
    this._fieldConfigBuilder.setOverrides(builder);
    return this;
  }

  /**
   * Set an individual panel option. This will merge the value with the existing options.
   */
  public setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._panelOptionsBuilder.setOption(id, value);
    return this;
  }

  /**
   * Build the panel.
   */
  public build(): VizConfig<TOptions, TFieldConfig> {
    return {
      pluginId: this._pluginId,
      pluginVersion: this._pluginVersion,
      options: this._panelOptionsBuilder.build(),
      fieldConfig: this._fieldConfigBuilder.build(),
    };
  }
}
