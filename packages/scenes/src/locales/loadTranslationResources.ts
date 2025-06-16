import { ResourceLoader, initPluginTranslations } from '@grafana/i18n';

const loadTranslationResources: ResourceLoader = async (locale: string) => {
  switch (locale) {
    case 'en-US': // Don't load the en-US bundle, it's the default in the source
    default:
      return Promise.resolve({});
  }
};

export const initTranslations = () => {
  return initPluginTranslations('grafana-scenes', [loadTranslationResources]);
};
