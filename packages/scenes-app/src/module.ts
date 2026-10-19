import { AppPlugin } from '@grafana/data';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';
import { App } from './components/App';
import pluginJson from './plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

export const plugin = new AppPlugin<{}>().setRootPage(App);
