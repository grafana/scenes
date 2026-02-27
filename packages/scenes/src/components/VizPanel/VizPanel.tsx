import { t } from '@grafana/i18n';
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
import { cloneDeep, isArray, isEmpty, merge, mergeWith } from 'lodash';
import { UserActionEvent } from '../../core/events';
import { evaluateTimeRange } from '../../utils/evaluateTimeRange';
import { LiveNowTimer } from '../../behaviors/LiveNowTimer';
import { VizPanelRenderProfiler } from '../../performance/VizPanelRenderProfiler';
import { registerQueryWithController, wrapPromiseInStateObservable } from '../../querying/registerQueryWithController';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { buildPathIdFor } from '../../utils/pathId';

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
   * Offset hoverHeader position on the y axis
   */
  hoverHeaderOffset?: number;
  /**
   * Allows adding elements to the subheader of the panel.
   */
  subHeader?: React.ReactNode | SceneObject | SceneObject[];
  /**
   * Only shows vizPanelMenu on hover if false, otherwise the menu is always visible in the header
   */
  showMenuAlways?: boolean;
  /**
   * Defines a menu in the top right of the panel. The menu object is only activated when the dropdown menu itself is shown.
   * So the best way to add dynamic menu actions and links is by adding them in a behavior attached to the menu.
   */
  menu?: VizPanelMenu;
  /**
   * Defines a menu that renders panel link.
   **/
  titleItems?: React.ReactNode | SceneObject | SceneObject[];
  seriesLimit?: number;
  seriesLimitShowAll?: boolean;
  /**
   * Add action to the top right panel header
   */
  headerActions?: React.ReactNode | SceneObject | SceneObject[];
  /**
   * Mainly for advanced use cases that need custom handling of PanelContext callbacks.
   */
  extendPanelContext?: (vizPanel: VizPanel, context: PanelContext) => void;

  /**
   * Sets panel chrome collapsed state
   */
  collapsible?: boolean;
  collapsed?: boolean;
  /** Marks object as a repeated object and a key pointer to source object */
  repeatSourceKey?: string;
  /**
   * @internal
   * Only for use from core to handle migration from old angular panels
   **/
  _UNSAFE_customMigrationHandler?: (panel: PanelModel, plugin: PanelPlugin) => void;
  /** Internal */
  _pluginLoadError?: string;
  /** Internal */
  _pluginInstanceState?: any;
  _renderCounter?: number;
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
  private _structureRev = 0;

  public constructor(state: Partial<VizPanelState<TOptions, TFieldConfig>>) {
    super({
      options: {} as TOptions,
      fieldConfig: { defaults: {}, overrides: [] },
      title: t('grafana-scenes.components.viz-panel.title.title', 'Title'),
      pluginId: 'timeseries',
      _renderCounter: 0,
      ...state,
    });

    this.addActivationHandler(() => {
      this._onActivate();
    });

    state.menu?.addActivationHandler(() => {
      this.publishEvent(new UserActionEvent({ origin: this, interaction: 'panel-menu-shown' }), true);
    });
  }

  /**
   * Get the VizPanelRenderProfiler behavior if attached
   */
  public getProfiler(): VizPanelRenderProfiler | undefined {
    if (!this.state.$behaviors) {
      return undefined;
    }

    for (const behavior of this.state.$behaviors) {
      if (behavior instanceof VizPanelRenderProfiler) {
        return behavior;
      }
    }

    return undefined;
  }

  private _onActivate() {
    if (!this._plugin) {
      this._loadPlugin(this.state.pluginId);
    }
  }

  public forceRender(): void {
    // Incrementing the render counter means VizRepeater and its children will also re-render
    this.setState({ _renderCounter: (this.state._renderCounter ?? 0) + 1 });
  }

  private async _loadPlugin(
    pluginId: string,
    overwriteOptions?: DeepPartial<{}>,
    overwriteFieldConfig?: FieldConfigSource,
    isAfterPluginChange?: boolean
  ) {
    const profiler = this.getProfiler();
    const plugin = loadPanelPluginSync(pluginId);

    if (plugin) {
      // Plugin was loaded from cache
      const endPluginLoadCallback = profiler?.onPluginLoadStart(pluginId);
      endPluginLoadCallback?.(plugin, true);
      this._pluginLoaded(plugin, overwriteOptions, overwriteFieldConfig, isAfterPluginChange);
    } else {
      const { importPanelPlugin } = getPluginImportUtils();

      try {
        // Start profiling plugin load - get end callback
        const endPluginLoadCallback = profiler?.onPluginLoadStart(pluginId);

        const panelPromise = importPanelPlugin(pluginId);

        const queryControler = sceneGraph.getQueryController(this);
        if (queryControler && queryControler.state.enableProfiling) {
          wrapPromiseInStateObservable(panelPromise)
            .pipe(registerQueryWithController({ type: `VizPanel/loadPlugin/${pluginId}`, origin: this }))
            .subscribe(() => {});
        }

        const result = await panelPromise;

        // End profiling plugin load (not from cache)
        endPluginLoadCallback?.(result, false);

        this._pluginLoaded(result, overwriteOptions, overwriteFieldConfig, isAfterPluginChange);
      } catch (err: unknown) {
        this._pluginLoaded(getPanelPluginNotFound(pluginId));

        if (err instanceof Error) {
          this.setState({ _pluginLoadError: err.message });
        }
      }
    }
  }

  public getLegacyPanelId() {
    /**
     * The `/` part is here because a panel key can be in a clone chain
     * A clone chain looks like `panel-1-clone-0/grid-item-5/panel-14` where the last part is the panel key
     */
    const parts = this.state.key?.split('/') ?? [];

    if (parts.length === 0) {
      return 0;
    }

    const part = parts[parts.length - 1];
    const panelId = parseInt(part!.replace('panel-', ''), 10);

    if (isNaN(panelId)) {
      return 0;
    }

    return panelId;
  }

  /**
   * Unique id string that includes local variable values (for repeated panels)
   */
  public getPathId() {
    return buildPathIdFor(this);
  }

  private async _pluginLoaded(
    plugin: PanelPlugin,
    overwriteOptions?: DeepPartial<{}>,
    overwriteFieldConfig?: FieldConfigSource,
    isAfterPluginChange?: boolean
  ) {
    const { options, fieldConfig, title, pluginVersion, _UNSAFE_customMigrationHandler } = this.state;

    const panel: PanelModel = {
      title,
      options,
      fieldConfig,
      id: this.getLegacyPanelId(),
      type: plugin.meta.id,
      pluginVersion: pluginVersion,
    };

    if (overwriteOptions) {
      panel.options = overwriteOptions;
    }

    if (overwriteFieldConfig) {
      panel.fieldConfig = overwriteFieldConfig;
    }

    const currentVersion = this._getPluginVersion(plugin);

    _UNSAFE_customMigrationHandler?.(panel, plugin);

    //@ts-expect-error (TODO: remove after upgrading with https://github.com/grafana/grafana/pull/108998)
    const needsMigration = currentVersion !== pluginVersion || plugin.shouldMigrate?.(panel);

    if (plugin.onPanelMigration && needsMigration && !isAfterPluginChange) {
      // These migration handlers also mutate panel.fieldConfig to migrate fieldConfig
      panel.options = await plugin.onPanelMigration(panel);
    }

    // Some panels mutate the transformations on the panel as part of migrations.
    // Unfortunately, these mutations are not available until the panel plugin is loaded.
    // At this time, the data provider is already set, so this is the easiest way to fix it.
    let $data = this.state.$data;
    if (panel.transformations && $data) {
      if ($data instanceof SceneDataTransformer) {
        $data.setState({ transformations: panel.transformations });
      } else if ($data instanceof SceneQueryRunner) {
        $data.clearParent();
        $data = new SceneDataTransformer({
          transformations: panel.transformations,
          $data,
        });
      }
    }

    const withDefaults = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: panel.options,
      currentFieldConfig: panel.fieldConfig,
      isAfterPluginChange: isAfterPluginChange ?? false,
    });

    this._plugin = plugin;

    this.setState({
      $data,
      options: withDefaults.options as DeepPartial<TOptions>,
      fieldConfig: withDefaults.fieldConfig,
      pluginVersion: currentVersion,
      pluginId: plugin.meta.id,
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
        sceneTimeRange.state.UNSAFE_nowDelay,
        sceneTimeRange.state.weekStart
      );
    }

    const plugin = this.getPlugin();
    if (plugin && !plugin.meta.skipDataQuery && data && data.timeRange) {
      return data.timeRange;
    }

    return sceneTimeRange.state.value;
  };

  public async changePluginType(pluginId: string, newOptions?: DeepPartial<{}>, newFieldConfig?: FieldConfigSource) {
    const { options: prevOptions, fieldConfig: prevFieldConfig, pluginId: prevPluginId } = this.state;

    //clear field config cache to update it later
    this._dataWithFieldConfig = undefined;

    // If state.pluginId is already the correct plugin we don't treat this as plain user panel type change
    const isAfterPluginChange = this.state.pluginId !== pluginId;
    await this._loadPlugin(pluginId, newOptions ?? {}, newFieldConfig, isAfterPluginChange);

    const panel: PanelModel = {
      title: this.state.title,
      options: this.state.options,
      fieldConfig: this.state.fieldConfig,
      id: 1,
      type: pluginId,
    };

    // onPanelTypeChanged is mainly used by plugins to migrate from Angular to React.
    // For example, this will migrate options from 'graph' to 'timeseries' if the previous and new plugin ID matches.
    const updatedOptions = this._plugin?.onPanelTypeChanged?.(panel, prevPluginId, prevOptions, prevFieldConfig);

    if (updatedOptions && !isEmpty(updatedOptions)) {
      this.onOptionsChange(updatedOptions, true, true);
    }
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

  public onToggleCollapse = (collapsed: boolean) => {
    this.setState({
      collapsed,
    });
  };

  public onOptionsChange = (optionsUpdate: DeepPartial<TOptions>, replace = false, isAfterPluginChange = false) => {
    const { fieldConfig, options } = this.state;

    // When replace is true, we want to replace the entire options object. Default will be applied.
    const nextOptions = replace
      ? optionsUpdate
      : mergeWith(cloneDeep(options), optionsUpdate, (objValue, srcValue, key, obj) => {
          if (isArray(srcValue)) {
            return srcValue;
          }
          // If customizer returns undefined, merging is handled by the method instead
          // so we need to override the value in the object instead
          if (objValue !== srcValue && typeof srcValue === 'undefined') {
            obj[key] = srcValue;
            return;
          }
          return;
        });

    const withDefaults = getPanelOptionsWithDefaults({
      plugin: this._plugin!,
      currentOptions: nextOptions,
      currentFieldConfig: fieldConfig,
      isAfterPluginChange: isAfterPluginChange,
    });

    this.setState({
      options: withDefaults.options as DeepPartial<TOptions>,
      _renderCounter: (this.state._renderCounter ?? 0) + 1,
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

  public clearFieldConfigCache() {
    this._dataWithFieldConfig = undefined;
  }

  /**
   * Called from the react render path to apply the field config to the data provided by the data provider
   */
  public applyFieldConfig(rawData?: PanelData): PanelData {
    const timestamp = performance.now();
    const plugin = this._plugin;

    const profiler = this.getProfiler();

    if (!plugin || plugin.meta.skipDataQuery || !rawData) {
      // TODO setup time range subscription instead
      return emptyPanelData;
    }

    // SceneQueryRunner preserves series array identity when frames haven't changed, but
    // still emits new PanelData on state transitions (onDataReceived). Detect this and skip
    // the expensive applyFieldOverrides step.
    if (this._prevData && this._dataWithFieldConfig) {
      if (this._prevData === rawData) {
        return this._dataWithFieldConfig;
      }
      if (this._prevData.series === rawData.series) {
        this._prevData = rawData;
        this._dataWithFieldConfig = {
          ...rawData,
          structureRev: this._dataWithFieldConfig.structureRev,
          series: this._dataWithFieldConfig.series,
        };
        return this._dataWithFieldConfig;
      }
    }

    // Start profiling data processing - get end callback
    const endFieldConfigCallback = profiler?.onFieldConfigStart(timestamp);

    const pluginDataSupport: PanelPluginDataSupport = plugin.dataSupport || { alertStates: false, annotations: false };

    const fieldConfigRegistry = plugin.fieldConfigRegistry;
    const prevFrames = this._dataWithFieldConfig?.series ?? [];
    const newFrames = applyFieldOverrides({
      data: rawData.series,
      fieldConfig: this.state.fieldConfig,
      fieldConfigRegistry,
      replaceVariables: this.interpolate,
      theme: config.theme2,
      timeZone: rawData.request?.timezone,
    });

    if (!compareArrayValues(newFrames, prevFrames, compareDataFrameStructures)) {
      this._structureRev++;
    }

    this._dataWithFieldConfig = {
      ...rawData,
      structureRev: this._structureRev,
      series: newFrames,
    };

    if (this._dataWithFieldConfig.annotations) {
      this._dataWithFieldConfig.annotations = applyFieldOverrides({
        data: this._dataWithFieldConfig.annotations,
        fieldConfig: {
          defaults: {},
          overrides: [...this.state.fieldConfig.overrides],
        },
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

    // End profiling data processing
    if (profiler) {
      endFieldConfigCallback?.(performance.now());
    }

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
    if (this._panelContext) {
      this._panelContext = {
        ...this._panelContext,
        instanceState: state,
      };
    }

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

  public clone(withState?: Partial<VizPanelState>) {
    // Clear _pluginInstanceState and _pluginLoadError as it's not safe to clone
    return super.clone({ _pluginInstanceState: undefined, _pluginLoadError: undefined, ...withState });
  }

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
