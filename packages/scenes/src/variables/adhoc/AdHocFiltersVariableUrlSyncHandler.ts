import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import { AdHocFiltersVariable, AdHocFilterWithLabels, isMultiValueOperator } from './AdHocFiltersVariable';
import { unescapeUrlDelimiters } from '../utils';

export class AdHocFiltersVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _variable: AdHocFiltersVariable) {}

  private getKey(): string {
    return `var-${this._variable.state.name}`;
  }

  public getKeys(): string[] {
    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    return { [this.getKey()]: this._variable.getValueForUrl()?.toString() ?? '' };
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

function toFilter(urlValue: string | number | boolean | undefined | null): AdHocFilterWithLabels | null {
  if (typeof urlValue !== 'string' || urlValue.length === 0) {
    return null;
  }

  const [key, keyLabel, operator, _operatorLabel, ...values] = urlValue
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
    value: values[0],
    // TODO remove expect-error when we're on the latest version of @grafana/data
    // @ts-expect-error
    values: isMultiValueOperator(operator) ? values.filter((_, index) => index % 2 === 0) : undefined,
    valueLabels: values.filter((_, index) => index % 2 === 1),
    condition: '',
  };
}

function isFilter(filter: AdHocFilterWithLabels | null): filter is AdHocFilterWithLabels {
  return filter !== null && typeof filter.key === 'string' && typeof filter.value === 'string';
}
