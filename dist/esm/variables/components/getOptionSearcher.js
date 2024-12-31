import { ALL_VARIABLE_VALUE, ALL_VARIABLE_TEXT } from '../constants.js';
import { getFuzzySearcher } from '../utils.js';

function getOptionSearcher(options, includeAll = false) {
  let allOptions = options;
  if (includeAll) {
    allOptions = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...allOptions];
  }
  const haystack = allOptions.map((o) => o.label);
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search) => fuzzySearch(search).map((i) => allOptions[i]);
}

export { getOptionSearcher };
//# sourceMappingURL=getOptionSearcher.js.map
