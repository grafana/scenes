import { VizPanel, VizPanelState } from '../../components/VizPanel/VizPanel';
import { DeepPartial, SceneObject } from '../types';
import { FieldConfigBuilder } from './FieldConfigBuilder';
import { FieldConfigOverridesBuilder } from './FieldConfigOverridesBuilder';
import { PanelOptionsBuilder } from './PanelOptionsBuilder';
import { StandardFieldConfig, StandardFieldConfigInterface } from './types';
import { limitFramesTransformation, TimeSeriesLimitSeriesTitleItemScene } from '../../components/LimitSeriesTitleItem';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';

export class VizPanelBuilder<TOptions extends {}, TFieldConfig extends {}>
  implements StandardFieldConfigInterface<StandardFieldConfig, VizPanelBuilder<TOptions, TFieldConfig>, 'set'>
{
  private _state: VizPanelState<TOptions, TFieldConfig> = {} as VizPanelState<TOptions, TFieldConfig>;
  private _fieldConfigBuilder: FieldConfigBuilder<TFieldConfig>;
  private _panelOptionsBuilder: PanelOptionsBuilder<TOptions>;

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
    this._state.pluginId = pluginId;
    this._state.pluginVersion = pluginVersion;

    this._fieldConfigBuilder = new FieldConfigBuilder(defaultFieldConfig);
    this._panelOptionsBuilder = new PanelOptionsBuilder(defaultOptions);
  }

  /**
   * Set panel title.
   */
  public setTitle(title: VizPanelState['title']): this {
    this._state.title = title;
    return this;
  }

  public setTitleItems(titleItems: React.ReactNode | SceneObject | SceneObject[]): this {
    this._state.titleItems = titleItems
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
   * Makes it possible to shared config between different builders
   */
  public applyMixin(mixin: (builder: this) => void): this {
    mixin(this);
    return this;
  }

  /**
   * Build the panel.
   */
  public build() {
    this.limitPanelSeries();

    const panel = new VizPanel<TOptions, TFieldConfig>({
      ...this._state,
      options: this._panelOptionsBuilder.build(),
      fieldConfig: this._fieldConfigBuilder.build(),
    });

    return panel;
  }

  /**
   * If titleItems contains TimeSeriesLimitSeriesTitleItemScene, replace queryProvider with SceneDataTransformer and limit the number of series initially rendered
   */
  private limitPanelSeries() {
    if(this._state.$data){
      const limitSeriesTitleItem = this.getLimitSeriesTitleItem()

      if (limitSeriesTitleItem && limitSeriesTitleItem.state.seriesLimit) {
        this.setData(new SceneDataTransformer({
          $data: this._state.$data,
          transformations: [() => limitFramesTransformation(limitSeriesTitleItem.state.seriesLimit)],
        }))
      }
    }
  }

  /**
   * Gets titleItem of type TimeSeriesLimitSeriesTitleItemScene, if existing
   */
  private getLimitSeriesTitleItem() {
    if (this._state.titleItems) {
      if (Array.isArray(this._state.titleItems)) {
        for (const titleItem of this._state.titleItems) {
          if (titleItem instanceof TimeSeriesLimitSeriesTitleItemScene) {
            return titleItem;
          }
        }
      } else if (this._state.titleItems instanceof TimeSeriesLimitSeriesTitleItemScene) {
        return this._state.titleItems;
      }
    }

    return undefined
  }
}
