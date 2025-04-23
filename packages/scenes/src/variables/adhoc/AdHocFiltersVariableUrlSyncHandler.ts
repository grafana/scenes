import { SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues } from '../../core/types';
import {
  AdHocFiltersVariable,
  AdHocFilterWithLabels,
  FilterOrigin,
  isFilterComplete,
  isMatchAllFilter,
  isMultiValueOperator,
} from './AdHocFiltersVariable';
import {
  escapeInjectedFilterUrlDelimiters,
  escapeUrlPipeDelimiters,
  toUrlCommaDelimitedString,
  unescapeUrlDelimiters,
} from '../utils';

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
    const baseFilters = this._variable.state.baseFilters;

    let value = [];

    if (filters.length === 0 && baseFilters?.length === 0) {
      return { [this.getKey()]: [''] };
    }

    if (filters.length) {
      value.push(
        ...filters
          .filter(isFilterComplete)
          .filter((filter) => !filter.hidden)
          .map((filter) => toArray(filter).map(escapeUrlPipeDelimiters).join('|'))
      );
    }

    if (baseFilters?.length) {
      // injected filters stored in the following format: normal|adhoc|values#filterOrigin#restorable
      value.push(
        ...baseFilters
          ?.filter(isFilterComplete)
          .filter((filter) => !filter.hidden && filter.origin && filter.restorable)
          .map((filter) =>
            toArray(filter).map(escapeInjectedFilterUrlDelimiters).join('|').concat(`#${filter.origin}#restorable`)
          )
      );
    }

    return {
      [this.getKey()]: value.length ? value : [''],
    };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    const urlValue = values[this.getKey()];

    if (urlValue == null) {
      return;
    }

    const filters = deserializeUrlToFilters(urlValue);
    const baseFilters = [...(this._variable.state.baseFilters || [])];

    for (let i = 0; i < filters.length; i++) {
      const foundBaseFilterIndex = baseFilters.findIndex((f) => f.key === filters[i].key);

      // if we find a match we update baseFilter with what's in the URL.
      // If there is a normal filter without an origin that matches keys with
      // some dashboard lvl filter we maintain it as dashboard lvl filter in the
      // new dashboard
      if (foundBaseFilterIndex > -1) {
        if (!filters[i].origin && baseFilters[foundBaseFilterIndex].origin === 'dashboard') {
          filters[i].origin = 'dashboard';
          filters[i].restorable = true;
        }

        if (isMatchAllFilter(filters[i])) {
          filters[i].matchAllFilter = true;
        }

        baseFilters[foundBaseFilterIndex] = filters[i];
      } else if (filters[i].origin === 'dashboard') {
        // if it was originating from a dashoard but has no match in the new dashboard
        // remove it's origin, turn it into a normal filter to be set below
        delete filters[i].origin;
        delete filters[i].restorable;
      } else if (foundBaseFilterIndex === -1 && filters[i].origin === 'scope' && filters[i].restorable) {
        // scopes are being set sometimes (when the observable emits actual filters) after urlSync
        // so we maintain all modified scopes in the adhoc
        // and leave the scopes update to reconciliate on what filters will actually show up
        baseFilters.push(filters[i]);
      }
    }

    this._variable.setState({
      filters: filters.filter((f) => !f.origin),
      baseFilters,
    });
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

  const [filter, origin, restorable] = urlValue.split('#');
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
    ...(isFilterOrigin(origin) && { origin }),
    ...(!!restorable && { restorable: true }),
  };
}

function isFilterOrigin(value: string): value is FilterOrigin {
  return value === 'scope' || value === 'dashboard';
}

function isFilter(filter: AdHocFilterWithLabels | null): filter is AdHocFilterWithLabels {
  return filter !== null && typeof filter.key === 'string' && typeof filter.value === 'string';
}
