import {
  AbsoluteTimeRange,
  FieldConfigSource,
  PanelModel,
  PanelPlugin,
  toUtc,
  getPanelOptionsWithDefaults,
  ScopedVars,
  InterpolateFunction,
  CoreApp,
  DashboardCursorSync,
  PanelData,
  compareArrayValues,
  compareDataFrameStructures,
  applyFieldOverrides,
  PluginType,
  renderMarkdown,
  PanelPluginDataSupport,
} from '@grafana/data';
import { PanelContext, SeriesVisibilityChangeMode, VizLegendOptions } from '@grafana/ui';
import { config, getAppEvents, getPluginImportUtils } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { DeepPartial, SceneObject, SceneObjectState } from '../../core/types';

import { VizPanelRenderer } from './VizPanelRenderer';
import { VizPanelMenu } from './VizPanelMenu';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig';
import { VariableCustomFormatterFn } from '../../variables/types';
import { seriesVisibilityConfigFactory } from './seriesVisibilityConfigFactory';
import { emptyPanelData } from '../../core/SceneDataNode';
import { changeSeriesColorConfigFactory } from './colorSeriesConfigFactory';
import { loadPanelPluginSync } from './registerRuntimePanelPlugin';
import { getCursorSyncScope } from '../../behaviors/CursorSync';
import { cloneDeep, isArray, merge, mergeWith } from 'lodash';
import { UserActionEvent } from '../../core/events';
import { evaluateTimeRange } from '../../utils/evaluateTimeRange';
import { LiveNowTimer } from '../../behaviors/LiveNowTimer';

export interface VizPanelState<TOptions = {}, TFieldConfig = {}> extends SceneObjectState {
  /**
   * This is usually a plugin id that references a core plugin or an external plugin. But this can also reference a
   * runtime registered PanelPlugin registered via function registerScenePanelPlugin.
   */
  pluginId: string;
  title: string;
  description?: string;
  options: DeepPartial<TOptions>;
  fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
  pluginVersion?: string;
  displayMode?: 'default' | 'transparent';
  /**
   * Only shows header on hover, absolutly positioned above the panel.
   */
  hoverHeader?: boolean;
  /**
   * Defines a menu in the top right of the panel. The menu object is only activated when the dropdown menu itself is shown.
   * So the best way to add dynamic menu actions and links is by adding them in a behavior attached to the menu.
   */
  menu?: VizPanelMenu;
  /**
   * Defines a menu that renders panel link.
   **/
  titleItems?: React.ReactNode | SceneObject | SceneObject[];
  /**
   * Add action to the top right panel header
   */
  headerActions?: React.ReactNode | SceneObject | SceneObject[];
  /**
   * Mainly for advanced use cases that need custom handling of PanelContext callbacks.
   */
  extendPanelContext?: (vizPanel: VizPanel, context: PanelContext) => void;
  /**
   * @internal
   * Only for use from core to handle migration from old angular panels
   **/
  _UNSAFE_customMigrationHandler?: (panel: PanelModel, plugin: PanelPlugin) => void;
  /** Internal */
  _pluginLoadError?: string;
  /** Internal */
  _pluginInstanceState?: any;
}

export class VizPanel<TOptions = {}, TFieldConfig extends {} = {}> extends SceneObjectBase<
  VizPanelState<TOptions, TFieldConfig>
> {
  public static Component = VizPanelRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title', 'options', 'fieldConfig'],
  });

  // Not part of state as this is not serializable
  protected _panelContext?: PanelContext;
  private _plugin?: PanelPlugin;
  private _prevData?: PanelData;
  private _dataWithFieldConfig?: PanelData;
  private _structureRev: number = 0;

  public constructor(state: Partial<VizPanelState<TOptions, TFieldConfig>>) {
    super({
      options: {} as TOptions,
      fieldConfig: { defaults: {}, overrides: [] },
      title: 'Title',
      pluginId: 'timeseries',
      ...state,
    });

    this.addActivationHandler(() => {
      this._onActivate();
    });

    state.menu?.addActivationHandler(() => {
      this.publishEvent(new UserActionEvent({ origin: this, interaction: 'panel-menu-shown' }), true);
    });
  }

  private _onActivate() {
    if (!this._plugin) {
      this._loadPlugin(this.state.pluginId);
    }
  }

  private async _loadPlugin(pluginId: string) {
    const plugin = loadPanelPluginSync(pluginId);

    if (plugin) {
      this._pluginLoaded(plugin);
    } else {
      const { importPanelPlugin } = getPluginImportUtils();

      try {
        const result = await importPanelPlugin(pluginId)
        this._pluginLoaded(result);
      } catch (err: unknown) {
        this._pluginLoaded(getPanelPluginNotFound(pluginId));

        if (err instanceof Error) {
          this.setState({ _pluginLoadError: err.message });
        }
      }
    }
  }

  public getLegacyPanelId() {
    return this.getPanelContext().instanceState?.legacyPanelId ?? 1;
  }

  private async _pluginLoaded(plugin: PanelPlugin) {
    const { options, fieldConfig, title, pluginVersion, _UNSAFE_customMigrationHandler } = this.state;

    const panel: PanelModel = {
      title,
      options,
      fieldConfig,
      id: this.getLegacyPanelId(),
      type: plugin.meta.id,
      pluginVersion: pluginVersion,
    };

    const currentVersion = this._getPluginVersion(plugin);

    _UNSAFE_customMigrationHandler?.(panel, plugin);

    if (plugin.onPanelMigration && currentVersion !== this.state.pluginVersion) {
      // These migration handlers also mutate panel.fieldConfig to migrate fieldConfig
      panel.options = await plugin.onPanelMigration(panel);
    }

    const withDefaults = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: panel.options,
      currentFieldConfig: panel.fieldConfig,
      isAfterPluginChange: false,
    });

    this._plugin = plugin;

    this.setState({
      options: withDefaults.options as DeepPartial<TOptions>,
      fieldConfig: withDefaults.fieldConfig,
      pluginVersion: currentVersion,
    });

    // Non data panels needs to be re-rendered when time range change
    if (plugin.meta.skipDataQuery) {
      const sceneTimeRange = sceneGraph.getTimeRange(this);
      this._subs.add(sceneTimeRange.subscribeToState(() => this.forceRender()));
    }
  }

  private _getPluginVersion(plugin: PanelPlugin): string {
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
  }

  public getPlugin(): PanelPlugin | undefined {
    return this._plugin;
  }

  public getPanelContext(): PanelContext {
    this._panelContext ??= this.buildPanelContext();
    return this._panelContext!;
  }

  public onTimeRangeChange = (timeRange: AbsoluteTimeRange) => {
    const sceneTimeRange = sceneGraph.getTimeRange(this);
    sceneTimeRange.onTimeRangeChange({
      raw: {
        from: toUtc(timeRange.from),
        to: toUtc(timeRange.to),
      },
      from: toUtc(timeRange.from),
      to: toUtc(timeRange.to),
    });
  };

  public getTimeRange = (data?: PanelData) => {
    const liveNowTimer = sceneGraph.findObject(this, (o) => o instanceof LiveNowTimer);
    const sceneTimeRange = sceneGraph.getTimeRange(this);
    if (liveNowTimer instanceof LiveNowTimer && liveNowTimer.isEnabled) {
      return evaluateTimeRange(
        sceneTimeRange.state.from,
        sceneTimeRange.state.to,
        sceneTimeRange.getTimeZone(),
        sceneTimeRange.state.fiscalYearStartMonth,
        sceneTimeRange.state.UNSAFE_nowDelay
      );
    }

    const plugin = this.getPlugin();
    if (plugin && !plugin.meta.skipDataQuery && data && data.timeRange) {
      return data.timeRange;
    }
  
    return sceneTimeRange.state.value;
  }

  public onTitleChange = (title: string) => {
    this.setState({ title });
  };

  public onDescriptionChange = (description: string) => {
    this.setState({ description });
  };

  public onDisplayModeChange = (displayMode: 'default' | 'transparent') => {
    this.setState({ displayMode });
  };

  public onOptionsChange = (optionsUpdate: DeepPartial<TOptions>, replace = false) => {
    const { fieldConfig, options } = this.state;

    // When replace is true, we want to replace the entire options object. Default will be applied.
    const nextOptions = replace
      ? optionsUpdate
      : mergeWith(cloneDeep(options), optionsUpdate, (_, srcValue) => {
          if (isArray(srcValue)) {
            return srcValue;
          }
          return;
        });

    const withDefaults = getPanelOptionsWithDefaults({
      plugin: this._plugin!,
      currentOptions: nextOptions,
      currentFieldConfig: fieldConfig,
      isAfterPluginChange: false,
    });

    this.setState({
      options: withDefaults.options as DeepPartial<TOptions>,
    });
  };

  public onFieldConfigChange = (fieldConfigUpdate: FieldConfigSource<DeepPartial<TFieldConfig>>, replace?: boolean) => {
    const { fieldConfig, options } = this.state;

    // When replace is true, we want to replace the entire field config. Default will be applied.
    const nextFieldConfig = replace ? fieldConfigUpdate : merge(cloneDeep(fieldConfig), fieldConfigUpdate);

    const withDefaults = getPanelOptionsWithDefaults({
      plugin: this._plugin!,
      currentOptions: options,
      currentFieldConfig: nextFieldConfig,
      isAfterPluginChange: false,
    });

    this._dataWithFieldConfig = undefined;
    this.setState({ fieldConfig: withDefaults.fieldConfig });
  };

  public interpolate = ((value: string, scoped?: ScopedVars, format?: string | VariableCustomFormatterFn) => {
    return sceneGraph.interpolate(this, value, scoped, format);
  }) as InterpolateFunction;

  public getDescription = () => {
    this.publishEvent(new UserActionEvent({ origin: this, interaction: 'panel-description-shown' }), true);

    const { description } = this.state;
    if (description) {
      const markdown = this.interpolate(description);
      return renderMarkdown(markdown);
    }
    return '';
  };

  /**
   * Called from the react render path to apply the field config to the data provided by the data provider
   */
  public applyFieldConfig(rawData?: PanelData): PanelData {
    const plugin = this._plugin;

    if (!plugin || plugin.meta.skipDataQuery || !rawData) {
      // TODO setup time range subscription instead
      return emptyPanelData;
    }

    // If the data is the same as last time, we can skip the field config apply step and just return same result as last time
    if (this._prevData === rawData && this._dataWithFieldConfig) {
      return this._dataWithFieldConfig;
    }

    const pluginDataSupport: PanelPluginDataSupport = plugin.dataSupport || { alertStates: false, annotations: false };

    const fieldConfigRegistry = plugin.fieldConfigRegistry;
    const prevFrames = this._prevData?.series;
    const newFrames = rawData?.series;

    if (
      rawData.structureRev == null &&
      newFrames &&
      prevFrames &&
      !compareArrayValues(newFrames, prevFrames, compareDataFrameStructures)
    ) {
      this._structureRev++;
    }

    this._dataWithFieldConfig = {
      ...rawData,
      structureRev: this._structureRev,
      series: applyFieldOverrides({
        data: newFrames,
        fieldConfig: this.state.fieldConfig,
        fieldConfigRegistry,
        replaceVariables: this.interpolate,
        theme: config.theme2,
        timeZone: rawData.request?.timezone,
      }),
    };

    if (this._dataWithFieldConfig.annotations) {
      this._dataWithFieldConfig.annotations = applyFieldOverrides({
        data: this._dataWithFieldConfig.annotations,
        fieldConfig: this.state.fieldConfig,
        fieldConfigRegistry,
        replaceVariables: this.interpolate,
        theme: config.theme2,
        timeZone: rawData.request?.timezone,
      });
    }

    if (!pluginDataSupport.alertStates) {
      this._dataWithFieldConfig.alertState = undefined;
    }

    if (!pluginDataSupport.annotations) {
      this._dataWithFieldConfig.annotations = undefined;
    }

    this._prevData = rawData;
    return this._dataWithFieldConfig;
  }

  public onCancelQuery = () => {
    this.publishEvent(new UserActionEvent({ origin: this, interaction: 'panel-cancel-query-clicked' }), true);
    const data = sceneGraph.getData(this);
    data.cancelQuery?.();
  };

  public onStatusMessageClick = () => {
    this.publishEvent(new UserActionEvent({ origin: this, interaction: 'panel-status-message-clicked' }), true);
  };

  /**
   * Panel context functions
   */
  private _onSeriesColorChange = (label: string, color: string) => {
    this.onFieldConfigChange(changeSeriesColorConfigFactory(label, color, this.state.fieldConfig));
  };

  private _onSeriesVisibilityChange = (label: string, mode: SeriesVisibilityChangeMode) => {
    if (!this._dataWithFieldConfig) {
      return;
    }

    this.onFieldConfigChange(
      seriesVisibilityConfigFactory(label, mode, this.state.fieldConfig, this._dataWithFieldConfig.series),
      true
    );
  };

  private _onInstanceStateChange = (state: any) => {
    this.setState({ _pluginInstanceState: state });
  };

  private _onToggleLegendSort = (sortKey: string) => {
    const legendOptions: VizLegendOptions = (this.state.options as any).legend;

    // We don't want to do anything when legend options are not available
    if (!legendOptions) {
      return;
    }

    let sortDesc = legendOptions.sortDesc;
    let sortBy = legendOptions.sortBy;
    if (sortKey !== sortBy) {
      sortDesc = undefined;
    }

    // if already sort ascending, disable sorting
    if (sortDesc === false) {
      sortBy = undefined;
      sortDesc = undefined;
    } else {
      sortDesc = !sortDesc;
      sortBy = sortKey;
    }

    this.onOptionsChange(
      {
        ...this.state.options,
        legend: { ...legendOptions, sortBy, sortDesc },
      } as TOptions,
      true
    );
  };

  private buildPanelContext(): PanelContext {
    const sync = getCursorSyncScope(this);

    const context = {
      eventsScope: sync ? sync.getEventsScope() : '__global_',
      eventBus: sync ? sync.getEventsBus(this) : getAppEvents(),
      app: CoreApp.Unknown,
      sync: () => {
        if (sync) {
          return sync.state.sync;
        }
        return DashboardCursorSync.Off;
      },
      onSeriesColorChange: this._onSeriesColorChange,
      onToggleSeriesVisibility: this._onSeriesVisibilityChange,
      onToggleLegendSort: this._onToggleLegendSort,
      onInstanceStateChange: this._onInstanceStateChange,
    };

    if (this.state.extendPanelContext) {
      this.state.extendPanelContext(this, context);
    }

    return context;
  }
}

function getPanelPluginNotFound(id: string): PanelPlugin {
  const plugin = new PanelPlugin(() => null);

  plugin.meta = {
    id: id,
    name: id,
    sort: 100,
    type: PluginType.panel,
    module: '',
    baseUrl: '',
    info: {
      author: {
        name: '',
      },
      description: '',
      links: [],
      logos: {
        large: '',
        small: 'public/img/grafana_icon.svg',
      },
      screenshots: [],
      updated: '',
      version: '',
    },
  };

  return plugin;
}
