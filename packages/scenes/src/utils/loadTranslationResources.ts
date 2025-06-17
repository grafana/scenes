import { LANGUAGES, ResourceLoader, initPluginTranslations, type Resources } from '@grafana/i18n';

const resources = LANGUAGES.reduce<Record<string, () => Promise<{ default: Resources }>>>((acc, lang) => {
  acc[lang.code] = async () => await import(`../locales/${lang.code}/grafana-scenes.json`);
  return acc;
}, {});

export const loadResources: ResourceLoader = async (resolvedLanguage: string) => {
  const translation = await resources[resolvedLanguage]();
  return translation.default;
};

export const initTranslations = () => {
  return initPluginTranslations('grafana-scenes', [loadResources]);
};
