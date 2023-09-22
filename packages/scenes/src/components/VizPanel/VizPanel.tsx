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

export interface VizPanelState<TOptions = {}, TFieldConfig = {}> extends SceneObjectState {
  title: string;
  description?: string;
  /**
   * This is usually a plugin id that references a core plugin or an external plugin. But this can also reference a
   * runtime registered PanelPlugin registered via function registerScenePanelPlugin.
   */
  pluginId: string;
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
}

export class VizPanel<TOptions = {}, TFieldConfig = {}> extends SceneObjectBase<VizPanelState<TOptions, TFieldConfig>> {
  public static Component = VizPanelRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title', 'options', 'fieldConfig'],
  });

  // Not part of state as this is not serializable
  private _plugin?: PanelPlugin;
  private _panelContext?: PanelContext;
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

    this.buildPanelContext();
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
      this.buildPanelContext();
    }

    return this._panelContext!;
  }

  public onChangeTimeRange = (timeRange: AbsoluteTimeRange) => {
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

  public onOptionsChange = (options: TOptions) => {
    this.setState({ options });
  };

  public onFieldConfigChange = (fieldConfig: FieldConfigSource<TFieldConfig>) => {
    this.setState({ fieldConfig });
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

  private buildPanelContext() {
    const sync = getCursorSyncScope(this);

    this._panelContext = {
      // @ts-ignore Waits for core release
      eventsScope: sync ? sync.getEventsScope() : '__global_',
      eventBus: sync ? sync.getEventsBus(this) : getAppEvents(),
      app: CoreApp.Unknown, // TODO,
      sync: () => {
        if (sync) {
          return sync.state.sync;
        }
        return DashboardCursorSync.Off;
      }, // TODO
      onSeriesColorChange: this._onSeriesColorChange,
      onToggleSeriesVisibility: this._onSeriesVisibilityChange,
      onToggleLegendSort: this._onToggleLegendSort,
      onInstanceStateChange: this._onInstanceStateChange,
      onAnnotationCreate: () => {}, //this.onAnnotationCreate,
      onAnnotationUpdate: () => {}, //this.onAnnotationUpdate,
      onAnnotationDelete: () => {}, //this.onAnnotationDelete,
      canAddAnnotations: () => false, //props.dashboard.canAddAnnotations.bind(props.dashboard),
      canEditAnnotations: () => false, //props.dashboard.canEditAnnotations.bind(props.dashboard),
      canDeleteAnnotations: () => false, // props.dashboard.canDeleteAnnotations.bind(props.dashboard),
    };
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