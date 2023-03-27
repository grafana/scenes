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
} from '@grafana/data';
import { PanelContext, SeriesVisibilityChangeMode } from '@grafana/ui';
import { config, getAppEvents, getPluginImportUtils } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { DeepPartial, SceneLayoutChildState } from '../../core/types';

import { VizPanelRenderer } from './VizPanelRenderer';
import { VizPanelMenu } from './VizPanelMenu';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig';
import { VariableCustomFormatterFn } from '../../variables/types';
import { seriesVisibilityConfigFactory } from './seriesVisibilityConfigFactory';

export interface VizPanelState<TOptions = {}, TFieldConfig = {}> extends SceneLayoutChildState {
  title: string;
  description?: string;
  pluginId: string;
  options: DeepPartial<TOptions>;
  fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
  pluginVersion?: string;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
  menu?: VizPanelMenu;
  // internal state
  pluginLoadError?: string;
}

export class VizPanel<TOptions = {}, TFieldConfig = {}> extends SceneObjectBase<VizPanelState<TOptions, TFieldConfig>> {
  public static Component = VizPanelRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title', 'options', 'fieldConfig'],
  });

  // Not part of state as this is not serializable
  private _plugin?: PanelPlugin;
  private _panelContext: PanelContext;

  public constructor(state: Partial<VizPanelState<TOptions, TFieldConfig>>) {
    super({
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      title: 'Title',
      pluginId: 'timeseries',
      ...state,
    });

    this._panelContext = {
      eventBus: getAppEvents(),
      app: CoreApp.Unknown, // TODO,
      sync: () => DashboardCursorSync.Off, // TODO
      onSeriesColorChange: this._onSeriesColorChange,
      onToggleSeriesVisibility: this._onSeriesVisibilityChange,
      // onAnnotationCreate: this.onAnnotationCreate,
      // onAnnotationUpdate: this.onAnnotationUpdate,
      // onAnnotationDelete: this.onAnnotationDelete,
      // onInstanceStateChange: this.onInstanceStateChange,
      // onToggleLegendSort: this.onToggleLegendSort,
      // canAddAnnotations: props.dashboard.canAddAnnotations.bind(props.dashboard),
      // canEditAnnotations: props.dashboard.canEditAnnotations.bind(props.dashboard),
      // canDeleteAnnotations: props.dashboard.canDeleteAnnotations.bind(props.dashboard),
    };

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    const { getPanelPluginFromCache, importPanelPlugin } = getPluginImportUtils();
    const plugin = getPanelPluginFromCache(this.state.pluginId);

    if (plugin) {
      this._pluginLoaded(plugin);
    } else {
      importPanelPlugin(this.state.pluginId)
        .then((result) => this._pluginLoaded(result))
        .catch((err: Error) => {
          this.setState({ pluginLoadError: err.message });
        });
    }
  }

  private _pluginLoaded(plugin: PanelPlugin) {
    const { options, fieldConfig, title, pluginId, pluginVersion } = this.state;

    const panel: PanelModel = { title, options, fieldConfig, id: 1, type: pluginId, pluginVersion: pluginVersion };
    const currentVersion = this._getPluginVersion(plugin);

    if (plugin.onPanelMigration) {
      if (currentVersion !== this.state.pluginVersion) {
        // These migration handlers also mutate panel.fieldConfig to migrate fieldConfig
        panel.options = plugin.onPanelMigration(panel);
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

  private _onSeriesColorChange = (label: string, color: string) => {
    //this.onFieldConfigChange(changeSeriesColorConfigFactory(label, color, this.props.panel.fieldConfig));
  };

  private _onSeriesVisibilityChange = (label: string, mode: SeriesVisibilityChangeMode) => {
    const data = sceneGraph.getData(this);
    this.onFieldConfigChange(
      seriesVisibilityConfigFactory(label, mode, this.state.fieldConfig, data.state.data!.series)
    );
  };

  private _getPluginVersion(plugin: PanelPlugin): string {
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
  }

  public getPlugin(): PanelPlugin | undefined {
    return this._plugin;
  }

  public getPanelContext(): PanelContext {
    return this._panelContext;
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
}
