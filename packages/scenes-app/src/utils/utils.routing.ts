import { PLUGIN_BASE_URL, ROUTES } from '../constants';

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: string): string {
  return `${PLUGIN_BASE_URL}/${route}`;
}

export function demoUrl(route: string): string {
  return `${prefixRoute(ROUTES.Demos)}/${route}`;
}
