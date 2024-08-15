import { config, locationService } from '@grafana/runtime';
import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { CustomVariableValue } from '../types';

export class UrlMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, _: SceneObject) {
    this.state = { name: name, type: 'url_macro' };
  }

  public getValue(fieldPath?: string) {
    const location = locationService.getLocation();
    const subUrl = config.appSubUrl ?? '';

    switch (fieldPath ?? '') {
      case 'params':
        return new UrlStateFormatter(location.search);
      case 'path':
        return subUrl + location.pathname;
      case '':
      default:
        return subUrl + location.pathname + location.search;
    }
  }

  public getValueText?(): string {
    return '';
  }
}

class UrlStateFormatter implements CustomVariableValue {
  public constructor(private _urlQueryParams: string) {}

  public formatter(options: string): string {
    if (!options) {
      return this._urlQueryParams;
    }

    const params = options.split(':');
    if (params[0] === 'exclude' && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      for (const param of params[1].split(',')) {
        allParams.delete(param);
      }

      return `?${allParams}`;
    }

    if (params[0] === 'include' && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      const includeOnly = params[1].split(',');

      for (const param of allParams.keys()) {
        if (!includeOnly.includes(param)) {
          allParams.delete(param);
        }
      }

      return `?${allParams}`;
    }

    return this._urlQueryParams;
  }
}
