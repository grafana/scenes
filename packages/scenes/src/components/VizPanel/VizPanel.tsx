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
import { cloneDeep, merge } from 'lodash';

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
  hoverHeader?: boolean;
  menu?: VizPanelMenu;
  headerActions?: React.ReactNode | SceneObject | SceneObject[];
  // internal state
  pluginLoadError?: string;
  pluginInstanceState?: any;
  extendPanelContext?: (vizPanel: VizPanel, context: PanelContext) => void;
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
  }

  private _onActivate() {
    if (!this._plugin) {
      this._loadPlugin(this.state.pluginId);
    }
  }

  private _loadPlugin(pluginId: string) {
    const plugin = loadPanelPluginSync(pluginId);

    if (plugin) {
      this._pluginLoaded(plugin);
    } else {
      const { importPanelPlugin } = getPluginImportUtils();

      try {
        importPanelPlugin(pluginId).then((result) => {
          return this._pluginLoaded(result);
        });
      } catch (err: unknown) {
        this._pluginLoaded(getPanelPluginNotFound(pluginId));
        this.setState({ pluginLoadError: (err as Error).message });
      }
    }
  }

  private async _pluginLoaded(plugin: PanelPlugin) {
    const { options, fieldConfig, title, pluginVersion } = this.state;

    const panel: PanelModel = {
      title,
      options,
      fieldConfig,
      id: 1,
      type: plugin.meta.id,
      pluginVersion: pluginVersion,
    };

    const currentVersion = this._getPluginVersion(plugin);

    if (plugin.onPanelMigration) {
      if (currentVersion !== this.state.pluginVersion) {
        // These migration handlers also mutate panel.fieldConfig to migrate fieldConfig
        panel.options = await plugin.onPanelMigration(panel);
      }
    }

    const withDefaults = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: panel.options,
      currentFieldConfig: panel.fieldConfig,
      isAfterPluginChange: false,
    });

    this._plugin = plugin;

    this.setState({
      options: withDefaults.options,
      fieldConfig: withDefaults.fieldConfig,
      pluginVersion: currentVersion,
    });
  }

  private _getPluginVersion(plugin: PanelPlugin): string {
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
  }

  public getPlugin(): PanelPlugin | undefined {
    return this._plugin;
  }

  public getPanelContext(): PanelContext {
    if (!this._panelContext) {
      this._panelContext = this.buildPanelContext();
    }

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
    const nextOptions = replace ? optionsUpdate : merge(cloneDeep(options), optionsUpdate);

    const withDefaults = getPanelOptionsWithDefaults({
      plugin: this._plugin!,
      currentOptions: nextOptions,
      currentFieldConfig: fieldConfig,
      isAfterPluginChange: false,
    });

    this.setState({
      options: withDefaults.options,
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

    this.setState({
      fieldConfig: withDefaults.fieldConfig,
    });
  };

  public interpolate = ((value: string, scoped?: ScopedVars, format?: string | VariableCustomFormatterFn) => {
    return sceneGraph.interpolate(this, value, scoped, format);
  }) as InterpolateFunction;

  /**
   * Called from the react render path to apply the field config to the data provided by the data provider
   */
  public applyFieldConfig(rawData?: PanelData): PanelData {
    const plugin = this._plugin!;

    if (!plugin || plugin.meta.skipDataQuery || !rawData) {
      // TODO setup time range subscription instead
      return emptyPanelData;
    }

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

    return this._dataWithFieldConfig;
  }

  public onCancelQuery = () => {
    const data = sceneGraph.getData(this);
    data.cancelQuery?.();
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
      seriesVisibilityConfigFactory(label, mode, this.state.fieldConfig, this._dataWithFieldConfig.series)
    );
  };

  private _onInstanceStateChange = (state: any) => {
    this.setState({ pluginInstanceState: state });
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

    this.onOptionsChange({
      ...this.state.options,
      legend: { ...legendOptions, sortBy, sortDesc },
    } as TOptions);
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

function getPanelPluginNotFound(id: string, silent?: boolean): PanelPlugin {
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
