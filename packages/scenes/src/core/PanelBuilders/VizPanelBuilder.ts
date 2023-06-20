import { FieldConfigSource } from '@grafana/data';
import { merge } from 'lodash';

import { VizPanel, VizPanelState } from '../../components/VizPanel/VizPanel';
import { DeepPartial } from '../types';
import { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder';
import { StandardFieldConfig, StandardFieldConfigInterface } from './types';

export class VizPanelBuilder<TOptions, TFieldConfig extends {}>
  implements StandardFieldConfigInterface<StandardFieldConfig, VizPanelBuilder<TOptions, TFieldConfig>, 'set'>
{
  private _state: VizPanelState<TOptions, TFieldConfig> = {} as VizPanelState<TOptions, TFieldConfig>;
  private _overridesBuilder = new FieldConfigOverridesBuilder<TFieldConfig>();

  public constructor(
    pluginId: string,
    pluginVersion: string,
    defaultOptions?: () => Partial<TOptions>,
    defaultFieldConfig?: () => TFieldConfig
  ) {
    this._state.title = '';
    this._state.description = '';
    this._state.displayMode = 'default';
    this._state.hoverHeader = false;
    this._state.isDraggable = false;
    this._state.isResizable = false;
    this._state.pluginId = pluginId;
    this._state.pluginVersion = pluginVersion;
    const fieldConfig: FieldConfigSource<TFieldConfig> = {
      defaults: {
        custom: defaultFieldConfig ? defaultFieldConfig() : ({} as TFieldConfig),
      }, // use field config factory that will provide default field config
      overrides: [],
    };

    this._state.options = defaultOptions ? defaultOptions() : ({} as TOptions);
    this._state.fieldConfig = fieldConfig;
  }

  /**
   * Set panel title.
   */
  public setTitle(title: VizPanelState['title']): this {
    this._state.title = title;
    return this;
  }

  /**
   * Set panel description.
   */
  public setDescription(description: VizPanelState['description']): this {
    this._state.description = description;
    return this;
  }

  /**
   * Set panel display mode.
   */
  public setDisplayMode(displayMode: VizPanelState['displayMode']): this {
    this._state.displayMode = displayMode;
    return this;
  }

  /**
   * Set if panel header should be shown on hover.
   */
  public setHoverHeader(hoverHeader: VizPanelState['hoverHeader']): this {
    this._state.hoverHeader = hoverHeader;
    return this;
  }

  /**
   * Set if panel is draggable.
   */
  public setIsDraggable(isDraggable: VizPanelState['isDraggable']): this {
    this._state.isDraggable = isDraggable;
    return this;
  }

  /**
   * Set if panel is resizable.
   */
  public setIsResizable(isResizable: VizPanelState['isResizable']): this {
    this._state.isResizable = isResizable;
    return this;
  }

  /**
   * Set panel menu scene object.
   */
  public setMenu(menu: VizPanelState['menu']): this {
    this._state.menu = menu;
    return this;
  }

  /**
   * Set scene object or react component to use as panel header actions.
   */
  public setHeaderActions(headerActions: VizPanelState['headerActions']): this {
    this._state.headerActions = headerActions;
    return this;
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
   * Set an individual panel option. This will merge the value with the existing options.
   */
  public setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._state.options = merge(this._state.options, { [id]: value });
    return this;
  }

  /**
   * Set an individual custom field config value. This will merge the value with the existing custom field config.
   */
  public setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._state.fieldConfig.defaults = {
      ...this._state.fieldConfig.defaults,
      custom: merge(this._state.fieldConfig.defaults.custom, { [id]: value }),
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

  /**
   * Set data provider for the panel.
   */
  public setData(data: VizPanelState['$data']): this {
    this._state.$data = data;
    return this;
  }

  /**
   * Set time range for the panel.
   */
  public setTimeRange(timeRange: VizPanelState['$timeRange']): this {
    this._state.$timeRange = timeRange;
    return this;
  }

  /**
   * Set variables for the panel.
   */
  public setVariables(variables: VizPanelState['$variables']): this {
    this._state.$variables = variables;
    return this;
  }

  /**
   * Set behaviors for the panel.
   */
  public setBehaviors(behaviors: VizPanelState['$behaviors']): this {
    this._state.$behaviors = behaviors;
    return this;
  }

  /**
   * Build the panel.
   */
  public build() {
    return new VizPanel<TOptions, TFieldConfig>({
      ...this._state,
      fieldConfig: {
        defaults: this._state.fieldConfig.defaults,
        overrides: this._overridesBuilder.build(),
      },
    });
  }

  private setFieldConfigDefaults<T extends keyof StandardFieldConfig>(key: T, value: StandardFieldConfig[T]) {
    this._state.fieldConfig.defaults = {
      ...this._state.fieldConfig.defaults,
      [key]: value,
    };
    return this;
  }
}
