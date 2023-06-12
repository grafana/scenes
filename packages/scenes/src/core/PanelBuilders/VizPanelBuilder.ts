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
    defaultOptions?: () => TOptions,
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

  public setTitle(title: VizPanelState['title']): this {
    this._state.title = title;
    return this;
  }

  public setDescription(description: VizPanelState['description']): this {
    this._state.description = description;
    return this;
  }

  public setDisplayMode(displayMode: VizPanelState['displayMode']): this {
    this._state.displayMode = displayMode;
    return this;
  }

  public setHoverHeader(hoverHeader: VizPanelState['hoverHeader']): this {
    this._state.hoverHeader = hoverHeader;
    return this;
  }

  public setIsDraggable(isDraggable: VizPanelState['isDraggable']): this {
    this._state.isDraggable = isDraggable;
    return this;
  }

  public setIsResizable(isResizable: VizPanelState['isResizable']): this {
    this._state.isResizable = isResizable;
    return this;
  }

  public setMenu(menu: VizPanelState['menu']): this {
    this._state.menu = menu;
    return this;
  }

  public setHeaderActions(headerActions: VizPanelState['headerActions']): this {
    this._state.headerActions = headerActions;
    return this;
  }

  public setOptions(options: DeepPartial<TOptions>): this {
    this._state.options = merge(this._state.options, options);
    return this;
  }

  public setColor(color: StandardFieldConfig['color']): this {
    return this.setFieldConfigDefaults('color', color);
  }

  public setDecimals(decimals: StandardFieldConfig['decimals']): this {
    return this.setFieldConfigDefaults('decimals', decimals);
  }

  public setDisplayName(displayName: StandardFieldConfig['displayName']): this {
    return this.setFieldConfigDefaults('displayName', displayName);
  }

  public setFilterable(filterable: StandardFieldConfig['filterable']): this {
    return this.setFieldConfigDefaults('filterable', filterable);
  }

  public setLinks(links: StandardFieldConfig['links']): this {
    return this.setFieldConfigDefaults('links', links);
  }

  public setMappings(mappings: StandardFieldConfig['mappings']): this {
    return this.setFieldConfigDefaults('mappings', mappings);
  }

  public setMax(max: StandardFieldConfig['max']): this {
    return this.setFieldConfigDefaults('max', max);
  }

  public setMin(min: StandardFieldConfig['min']): this {
    return this.setFieldConfigDefaults('min', min);
  }

  public setNoValue(noValue: StandardFieldConfig['noValue']): this {
    return this.setFieldConfigDefaults('noValue', noValue);
  }

  public setThresholds(thresholds: StandardFieldConfig['thresholds']): this {
    return this.setFieldConfigDefaults('thresholds', thresholds);
  }

  public setUnit(unit: StandardFieldConfig['unit']): this {
    return this.setFieldConfigDefaults('unit', unit);
  }

  private setFieldConfigDefaults<T extends keyof StandardFieldConfig>(key: T, value: StandardFieldConfig[T]) {
    this._state.fieldConfig.defaults = {
      ...this._state.fieldConfig.defaults,
      [key]: value,
    };
    return this;
  }

  public setFieldConfig(fieldConfig: DeepPartial<TFieldConfig>): this {
    this._state.fieldConfig.defaults = {
      ...this._state.fieldConfig.defaults,
      custom: merge(this._state.fieldConfig.defaults.custom, fieldConfig),
    };
    return this;
  }

  public setFieldConfigOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this {
    builder(this._overridesBuilder);
    return this;
  }

  public setData(data: VizPanelState['$data']): this {
    this._state.$data = data;
    return this;
  }

  public setTimeRange(timeRange: VizPanelState['$timeRange']): this {
    this._state.$timeRange = timeRange;
    return this;
  }

  public setVariables(variables: VizPanelState['$variables']): this {
    this._state.$variables = variables;
    return this;
  }

  public build() {
    return new VizPanel<TOptions, TFieldConfig>({
      ...this._state,
      fieldConfig: {
        defaults: this._state.fieldConfig.defaults,
        overrides: this._overridesBuilder.build(),
      },
    });
  }
}
