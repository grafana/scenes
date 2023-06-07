import {
  BasicValueMatcherOptions,
  FieldConfig,
  FieldConfigProperty,
  FieldMatcherID,
  FieldType,
  RangeValueMatcherOptions,
  ValueMatcherID,
  ValueMatcherOptions,
} from '@grafana/data';
import { FieldConfigSource, MatcherConfig } from '@grafana/schema';
import { merge } from 'lodash';

import { VizPanel, VizPanelState } from '../../components/VizPanel/VizPanel';
import { DeepPartial } from '../types';

export type PropertySetter<T> = <K extends keyof T>(id: K, value: T[K]) => PropertySetter<T>;
export type OverridesSetter<T> = (matcher: MatcherConfig) => PropertySetter<T>;
export type OverridesBuilder<T> = (builder: OverridesSetter<T>) => void;

interface StandardFieldConfig
  extends Omit<
    FieldConfig,
    'overrides' | 'custom' | 'displayNameFromDS' | 'description' | 'writeable' | 'path' | 'type'
  > {}

export class VizPanelBuilder<TOptions, TFieldConfig extends {}> {
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
    // @ts-ignore VizPanelState is typed with DeepPartial, think we need to change that
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

  public setStandardConfig(config: { [K in keyof StandardFieldConfig]: StandardFieldConfig[K] }): this {
    this._state.fieldConfig.defaults = {
      ...this._state.fieldConfig.defaults,
      ...config,
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

  public build() {
    return new VizPanel<TOptions, TFieldConfig>({
      ...this._state,
      fieldConfig: {
        defaults: this._state.fieldConfig!.defaults,
        overrides: this._overridesBuilder.build(),
      },
    });
  }
}

class FieldConfigOverridesBuilder<TFieldConfig> {
  private _overrides: Array<{ matcher: MatcherConfig; properties: Array<{ id: string; value: unknown }> }> = [];

  public match(matcher: MatcherConfig): this {
    this._overrides.push({ matcher, properties: [] });
    return this;
  }

  public matchFieldsWithName(name: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byName,

        options: name,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsWithNameByRegex(regex: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byRegexpOrNames,
        options: regex,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByType(fieldType: FieldType): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byType,
        options: fieldType,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByQuery(refId: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byFrameRefID,
        options: refId,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByValue(
    id: ValueMatcherID,
    options: ValueMatcherOptions | BasicValueMatcherOptions | RangeValueMatcherOptions
  ): this {
    this._overrides.push({
      matcher: {
        id,
        options,
      },
      properties: [],
    });
    return this;
  }

  public override<T extends TFieldConfig & StandardFieldConfig, K extends keyof T>(id: K, value: T[K]): this {
    const _id = this.isStandardFieldConfigId(String(id)) ? String(id) : `custom.${String(id)}`;
    const last = this._overrides[this._overrides.length - 1];
    last.properties.push({ id: _id, value });
    return this;
  }

  public build() {
    return this._overrides;
  }

  private isStandardFieldConfigId(id: string) {
    return (Object.values(FieldConfigProperty) as string[]).includes(id);
  }
}
