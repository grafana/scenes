import { AppSettings } from './shared';

export function loadSettings(): Promise<AppSettings> {
  let settings: AppSettings = {};

  const settingsJson = localStorage.getItem('dynamic_app');
  if (settingsJson) {
    settings = JSON.parse(settingsJson);
  }

  return new Promise<AppSettings>((resolve) => {
    setTimeout(() => {
      resolve(settings);
    }, 2000);
  });
}

export function saveSettings(setting: AppSettings): Promise<boolean> {
  localStorage.setItem('dynamic_app', JSON.stringify(setting));

  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}
