import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import { AdHocFiltersVariable, AdHocFilterWithLabels } from './AdHocFiltersVariable';

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

    const value = filters.map((filter) => toArray(filter).map(escapePipeDelimiters).join('|'));
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

function deserializeUrlToFilters(value: SceneObjectUrlValue): AdHocFilterWithLabels[] {
  if (Array.isArray(value)) {
    const values = value;
    return values.map(toFilter).filter(isFilter);
  }

  const filter = toFilter(value);
  return filter === null ? [] : [filter];
}

function escapePipeDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Replace the pipe due to using it as a filter separator
  return (value = /\|/g[Symbol.replace](value, '__gfp__'));
}

function escapeCommaDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Replace the comma due to using it as a value/label separator
  return /,/g[Symbol.replace](value, '__gfc__');
}

function unescapeDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  value = /__gfp__/g[Symbol.replace](value, '|');
  value = /__gfc__/g[Symbol.replace](value, ',');

  return value;
}

function toArray(filter: AdHocFilterWithLabels): string[] {
  return [
    toCommaDelimitedString(filter.key, filter.keyLabel),
    filter.operator,
    toCommaDelimitedString(filter.value, filter.valueLabel),
  ];
}

function toCommaDelimitedString(key: string, label?: string): string {
  // Omit for identical key/label or when label is not set at all
  if (!label || key === label) {
    return escapeCommaDelimiters(key);
  }

  return [key, label].map(escapeCommaDelimiters).join(',');
}

function toFilter(urlValue: string | number | boolean | undefined | null): AdHocFilterWithLabels | null {
  if (typeof urlValue !== 'string' || urlValue.length === 0) {
    return null;
  }

  const [key, keyLabel, operator, _operatorLabel, value, valueLabel] = urlValue
    .split('|')
    .reduce<string[]>((acc, v) => {
      const [key, label] = v.split(',');

      acc.push(key, label ?? key);

      return acc;
    }, [])
    .map(unescapeDelimiters);

  return {
    key,
    keyLabel,
    operator,
    value,
    valueLabel,
    condition: '',
  };
}

function isFilter(filter: AdHocFilterWithLabels | null): filter is AdHocFilterWithLabels {
  return filter !== null && typeof filter.key === 'string' && typeof filter.value === 'string';
}
