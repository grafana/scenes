import { ComponentType } from 'react';
import { PanelPluginMeta, PanelProps, PanelPlugin, PluginType } from '@grafana/data';

export function getPanelPlugin(
  options: Partial<PanelPluginMeta>,
  reactPanel?: ComponentType<PanelProps>,
  angularPanel?: any
): PanelPlugin {
  const plugin = new PanelPlugin(reactPanel!);
  plugin.angularPanelCtrl = angularPanel;
  plugin.meta = {
    id: options.id!,
    type: PluginType.panel,
    name: options.id!,
    sort: options.sort || 1,
    info: {
      author: {
        name: options.id + 'name',
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
    },
    hideFromList: options.hideFromList === true,
    module: options.module ?? '',
    baseUrl: '',
  };
  return plugin;
}
