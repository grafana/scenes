import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import { AdHocFiltersVariable, AdHocFilterWithLabels, isFilterComplete } from './AdHocFiltersVariable';
import { escapeUrlPipeDelimiters, toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils';

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

    const value = filters.filter(isFilterComplete).map((filter) => toArray(filter).map(escapeUrlPipeDelimiters).join('|'));
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

function toArray(filter: AdHocFilterWithLabels): string[] {
  return [
    toUrlCommaDelimitedString(filter.key, filter.keyLabel),
    filter.operator,
    toUrlCommaDelimitedString(filter.value, filter.valueLabel),
  ];
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
    .map(unescapeUrlDelimiters);

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
