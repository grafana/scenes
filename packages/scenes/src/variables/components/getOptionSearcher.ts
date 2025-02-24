import { VariableValueOption } from '../types';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { getFuzzySearcher } from '../utils';

export function getOptionSearcher(options: VariableValueOption[], includeAll = false) {
  let allOptions = options;

  if (includeAll) {
    allOptions = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...allOptions];
  }

  const haystack = allOptions.map((o) => o.label);
  const fuzzySearch = getFuzzySearcher(haystack);

  return (search: string) => fuzzySearch(search).map((i) => allOptions[i]);
}
