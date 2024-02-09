import { AdHocVariableFilter } from '@grafana/data';
import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

export class AdHocFiltersVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _variable: AdHocFiltersVariable) {}

  private getKey(): string {
    return `var-${this._variable.state.name}`;
  }

  public getKeys(): string[] {
    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    const filters = this._variable.state.filters;

    if (filters.length === 0) {
      return { [this.getKey()]: [''] };
    }

    const value = filters.map((filter) => toArray(filter).map(escapeDelimiter).join('|'));
    return { [this.getKey()]: value };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    const urlValue = values[this.getKey()];

    if (urlValue == null) {
      return;
    }

    const filters = deserializeUrlToFilters(urlValue);
    this._variable.setState({ filters });
  }
}

function deserializeUrlToFilters(value: SceneObjectUrlValue): AdHocVariableFilter[] {
  if (Array.isArray(value)) {
    const values = value;
    return values.map(toFilter).filter(isFilter);
  }

  const filter = toFilter(value);
  return filter === null ? [] : [filter];
}

function escapeDelimiter(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return /\|/g[Symbol.replace](value, '__gfp__');
}

function unescapeDelimiter(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return /__gfp__/g[Symbol.replace](value, '|');
}

function toArray(filter: AdHocVariableFilter): string[] {
  return [filter.key, filter.operator, filter.value];
}

function toFilter(value: string | number | boolean | undefined | null): AdHocVariableFilter | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const parts = value.split('|').map(unescapeDelimiter);

  return {
    key: parts[0],
    operator: parts[1],
    value: parts[2],
    condition: '',
  };
}

function isFilter(filter: AdHocVariableFilter | null): filter is AdHocVariableFilter {
  return filter !== null && typeof filter.key === 'string' && typeof filter.value === 'string';
}
