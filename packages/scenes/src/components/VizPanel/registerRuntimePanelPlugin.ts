import { PanelPlugin, PluginMetaInfo } from '@grafana/data';
import { getPluginImportUtils } from '@grafana/runtime';

export const runtimePanelPlugins = new Map<string, PanelPlugin>();

export interface RuntimePanelPluginOptions {
  pluginId: string;
  plugin: PanelPlugin;
}

export function registerRuntimePanelPlugin({ pluginId, plugin }: RuntimePanelPluginOptions) {
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

  return runtimePanelPlugins.get(pluginId) ?? getPanelPluginFromCache(pluginId);
}
