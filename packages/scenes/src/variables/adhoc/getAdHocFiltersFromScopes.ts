import { Scope, ScopeFilterOperator, ScopeSpecFilter, scopeFilterOperatorMap } from '@grafana/data';
import { AdHocFilterWithLabels } from './AdHocFiltersVariable';

export type EqualityOrMultiOperator = Extract<ScopeFilterOperator, 'equals' | 'not-equals' | 'one-of' | 'not-one-of'>;

export const reverseScopeFilterOperatorMap: Record<ScopeFilterOperator, string> = Object.fromEntries(
  Object.entries(scopeFilterOperatorMap).map(([symbol, operator]) => [operator, symbol])
) as Record<ScopeFilterOperator, string>;

export function isEqualityOrMultiOperator(value: string): value is EqualityOrMultiOperator {
  const operators = new Set(['equals', 'not-equals', 'one-of', 'not-one-of']);
  return operators.has(value);
}

// this function returns processed adhoc filters after parsing and processing
// all scope filters from a scope list. The reason we need to process these filters is
// because scopes can have multiple filter values with the same key. For example:
// we have selected ScopeA which has a filter with a key1, operator one-of, a value1,
// and a ScopeB which has a filter with key1, operator one-of, and value2. After processing,
// the result will be just one adhoc filter with both values. This is held in formattedFilters.
// DuplicatedFilters will containg unprocessable filters: if scopeA has instead of the one-of op
// an equal op, then the result will be 2 adhoc filters with the same key, but diferent operator
// and value. We return them this way and let the adhoc interface deal with this.
export function getAdHocFiltersFromScopes(scopes: Scope[]): AdHocFilterWithLabels[] {
  const formattedFilters: Map<string, AdHocFilterWithLabels> = new Map();
  // duplicated filters that could not be processed in any way are just appended to the list
  const duplicatedFilters: AdHocFilterWithLabels[] = [];
  const allFilters = scopes.flatMap((scope) => scope.spec.filters);

  for (const filter of allFilters) {
    processFilter(formattedFilters, duplicatedFilters, filter);
  }

  return [...formattedFilters.values(), ...duplicatedFilters];
}

function processFilter(
  formattedFilters: Map<string, AdHocFilterWithLabels>,
  duplicatedFilters: AdHocFilterWithLabels[],
  filter: ScopeSpecFilter
) {
  if (!filter) {
    return;
  }

  const existingFilter = formattedFilters.get(filter.key);

  if (existingFilter && canValueBeMerged(existingFilter.operator, filter.operator)) {
    mergeFilterValues(existingFilter, filter);
  } else if (!existingFilter) {
    // Add filter to map either only if it is new.
    // Otherwise it is an existing filter that cannot be converted to multi-value
    // and thus will be moved to the duplicatedFilters list
    formattedFilters.set(filter.key, {
      key: filter.key,
      operator: reverseScopeFilterOperatorMap[filter.operator],
      value: filter.value,
      values: filter.values ?? [filter.value],
      origin: 'scope',
    });
  } else {
    duplicatedFilters.push({
      key: filter.key,
      operator: reverseScopeFilterOperatorMap[filter.operator],
      value: filter.value,
      values: filter.values ?? [filter.value],
      origin: 'scope',
    });
  }
}

function mergeFilterValues(adHocFilter: AdHocFilterWithLabels, filter: ScopeSpecFilter) {
  const values = filter.values ?? [filter.value];

  for (const value of values) {
    if (!adHocFilter.values?.includes(value)) {
      adHocFilter.values?.push(value);
    }
  }

  // If there's only one value, there's no need to update the
  // operator to its multi-value equivalent
  if (adHocFilter.values?.length === 1) {
    return;
  }

  // Otherwise update it to the equivalent multi-value operator
  if (filter.operator === 'equals' && adHocFilter.operator === reverseScopeFilterOperatorMap['equals']) {
    adHocFilter.operator = reverseScopeFilterOperatorMap['one-of'];
  } else if (filter.operator === 'not-equals' && adHocFilter.operator === reverseScopeFilterOperatorMap['not-equals']) {
    adHocFilter.operator = reverseScopeFilterOperatorMap['not-one-of'];
  }
}

function canValueBeMerged(adHocFilterOperator: string, filterOperator: string) {
  const scopeConvertedOperator = scopeFilterOperatorMap[adHocFilterOperator];

  if (!isEqualityOrMultiOperator(scopeConvertedOperator) || !isEqualityOrMultiOperator(filterOperator)) {
    return false;
  }

  if (
    (scopeConvertedOperator.includes('not') && !filterOperator.includes('not')) ||
    (!scopeConvertedOperator.includes('not') && filterOperator.includes('not'))
  ) {
    return false;
  }

  return true;
}
