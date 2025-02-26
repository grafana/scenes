import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import {
  AdHocFiltersVariable,
  AdHocFilterWithLabels,
  isFilterComplete,
  isMultiValueOperator,
} from './AdHocFiltersVariable';
import { escapeUrlPipeDelimiters, toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils';

export class AdHocFiltersVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _variable: AdHocFiltersVariable) {}

  private getKey(isInjected?: boolean): string {
    if (isInjected) {
      return `var-injected-${this._variable.state.name}`;
    }

    return `var-${this._variable.state.name}`;
  }

  public getKeys(): string[] {
    return [this.getKey(), this.getKey(true)];
  }

  public getUrlState(): SceneObjectUrlValues {
    const filters = this._variable.state.filters;
    const baseFilters = this._variable.state.baseFilters;

    let value = [''];
    let baseValues = [''];

    if (filters.length === 0 && baseFilters?.length === 0) {
      return { [this.getKey()]: value, [this.getKey(true)]: baseValues };
    }

    if (filters.length) {
      value = filters
        .filter(isFilterComplete)
        .filter((filter) => !filter.hidden)
        .map((filter) => toArray(filter).map(escapeUrlPipeDelimiters).join('|'));
    }

    if (baseFilters?.length) {
      baseValues = baseFilters
        ?.filter(isFilterComplete)
        .filter((filter) => !filter.hidden && filter.source)
        .map((filter) =>
          toArray(filter)
            .map(escapeUrlPipeDelimiters)
            .join('|')
            .concat(`/${filter.originalValue?.map(escapeUrlPipeDelimiters).join('|') ?? ''}/${filter.source}`)
        );
    }

    return { [this.getKey()]: value, [this.getKey(true)]: baseValues };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    const urlValue = values[this.getKey()];
    const urlValueBaseFilters = values[this.getKey(true)];

    if (urlValue == null && urlValueBaseFilters == null) {
      return;
    }

    if (urlValue) {
      const filters = deserializeUrlToFilters(urlValue);
      this._variable.setState({ filters });
    }

    if (urlValueBaseFilters) {
      const baseFilters = deserializeUrlToFilters(urlValueBaseFilters);
      this._variable.setState({ baseFilters });
    }
  }
}

function deserializeUrlToFilters(value: SceneObjectUrlValue): AdHocFilterWithLabels[] {
  if (Array.isArray(value)) {
    const values = value;
    return values.map((value) => toFilter(value)).filter(isFilter);
  }

  const filter = toFilter(value);
  return filter === null ? [] : [filter];
}

function toArray(filter: AdHocFilterWithLabels): string[] {
  const result = [toUrlCommaDelimitedString(filter.key, filter.keyLabel), filter.operator];
  if (isMultiValueOperator(filter.operator)) {
    // TODO remove expect-error when we're on the latest version of @grafana/data
    // @ts-expect-error
    filter.values.forEach((value, index) => {
      result.push(toUrlCommaDelimitedString(value, filter.valueLabels?.[index]));
    });
  } else {
    result.push(toUrlCommaDelimitedString(filter.value, filter.valueLabels?.[0]));
  }
  return result;
}

function toFilter(urlValue: string | number | boolean | undefined | null): AdHocFilterWithLabels | null {
  if (typeof urlValue !== 'string' || urlValue.length === 0) {
    return null;
  }

  const [filter, originalValues, source] = urlValue.split('/');

  const [key, keyLabel, operator, _operatorLabel, ...values] = filter
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
    values: isMultiValueOperator(operator) ? values.filter((_, index) => index % 2 === 0) : undefined,
    valueLabels: values.filter((_, index) => index % 2 === 1),
    condition: '',
    source: source,
    originalValue: originalValues && originalValues.length ? originalValues.split('|') ?? [originalValues] : undefined,
  };
}

function isFilter(filter: AdHocFilterWithLabels | null): filter is AdHocFilterWithLabels {
  return filter !== null && typeof filter.key === 'string' && typeof filter.value === 'string';
}
