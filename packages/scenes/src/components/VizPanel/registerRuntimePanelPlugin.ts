import { PanelPlugin, PluginMetaInfo } from '@grafana/data';
import { getPluginImportUtils } from '@grafana/runtime';

export const runtimePanelPlugins = new Map<string, PanelPlugin>();

export interface RuntimePanelPluginOptions {
  /**
   * Please specify a pluginId that is unlikely to collide with other plugins.
   */
  pluginId: string;
  plugin: PanelPlugin;
}

/**
 * Provides a way to register runtime panel plugins.
 * Please use a pluginId that is unlikely to collide with other plugins.
 */
export function registerRuntimePanelPlugin({ pluginId, plugin }: RuntimePanelPluginOptions) {
  if (runtimePanelPlugins.has(pluginId)) {
    throw new Error(`A runtime panel plugin with id ${pluginId} has already been registered`);
  }

  plugin.meta = {
    ...plugin.meta,
    id: pluginId,
    name: pluginId,
    module: 'runtime plugin',
    baseUrl: 'runtime plugin',
    info: {
      author: {
        name: 'Runtime plugin ' + pluginId,
      },
      description: '',
      links: [],
      logos: {
        large: '',
        small: '',
      },
      screenshots: [],
      updated: '',
      version: '',
    } as PluginMetaInfo,
  };

  runtimePanelPlugins.set(pluginId, plugin);
}

export function loadPanelPluginSync(pluginId: string) {
  const { getPanelPluginFromCache } = getPluginImportUtils();

  return getPanelPluginFromCache(pluginId) ?? runtimePanelPlugins.get(pluginId);
}
