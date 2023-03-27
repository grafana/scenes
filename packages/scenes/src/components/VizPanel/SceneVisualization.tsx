import {
  AbsoluteTimeRange,
  FieldConfigSource,
  PanelModel,
  PanelPlugin,
  toUtc,
  getPanelOptionsWithDefaults,
  ScopedVars,
  InterpolateFunction,
} from '@grafana/data';
import { config, getPluginImportUtils } from '@grafana/runtime';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { DeepPartial, SceneLayoutChildState } from '../../core/types';

import { VizPanelRenderer } from './VizPanelRenderer';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig';
import { VariableCustomFormatterFn } from '../../variables/types';

export interface SceneVisualizationState<TOptions = {}, TFieldConfig = {}> extends SceneLayoutChildState {
  pluginId: string;
  options: DeepPartial<TOptions>;
  fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
  pluginVersion?: string;
  // internal state
  pluginLoadError?: string;
}

export class SceneVisualization<TOptions = {}, TFieldConfig = {}> extends SceneObjectBase<
  SceneVisualizationState<TOptions, TFieldConfig>
> {
  public static Component = VizPanelRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['options', 'fieldConfig'],
  });

  // Not part of state as this is not serializable
  private _plugin?: PanelPlugin;

  public constructor(state: Partial<SceneVisualizationState<TOptions, TFieldConfig>>) {
    super({
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      pluginId: 'timeseries',
      ...state,
    });
  }

  public activate() {
    super.activate();
    const { getPanelPluginFromCache, importPanelPlugin } = getPluginImportUtils();
    const plugin = getPanelPluginFromCache(this.state.pluginId);

    if (plugin) {
      this.pluginLoaded(plugin);
    } else {
      importPanelPlugin(this.state.pluginId)
        .then((result) => this.pluginLoaded(result))
        .catch((err: Error) => {
          this.setState({ pluginLoadError: err.message });
        });
    }
  }

  private pluginLoaded(plugin: PanelPlugin) {
    const { options, fieldConfig, pluginId, pluginVersion } = this.state;

    const panel: PanelModel = { options, fieldConfig, id: 1, type: pluginId, pluginVersion: pluginVersion };
    const currentVersion = this.getPluginVersion(plugin);

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

  private getPluginVersion(plugin: PanelPlugin): string {
    return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
  }

  public getPlugin(): PanelPlugin | undefined {
    return this._plugin;
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
