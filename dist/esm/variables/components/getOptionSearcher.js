import uFuzzy from '@leeoniya/ufuzzy';
import { ALL_VARIABLE_VALUE, ALL_VARIABLE_TEXT } from '../constants.js';

function getOptionSearcher(options, includeAll) {
  const ufuzzy = new uFuzzy();
  let allOptions = options;
  const haystack = [];
  const limit = 1e4;
  if (includeAll) {
    allOptions = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...allOptions];
  }
  return (search) => {
    if (search === "") {
      if (allOptions.length > limit) {
        return allOptions.slice(0, limit);
      } else {
        return allOptions;
      }
    }
    if (haystack.length === 0) {
      for (let i = 0; i < allOptions.length; i++) {
        haystack.push(allOptions[i].label);
      }
    }
    const [idxs, info, order] = ufuzzy.search(haystack, search);
    const filteredOptions = [];
    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        if (info && order) {
          const idx = order[i];
          filteredOptions.push(allOptions[idxs[idx]]);
        } else {
          filteredOptions.push(allOptions[idxs[i]]);
        }
        if (filteredOptions.length > limit) {
          return filteredOptions;
        }
      }
      return filteredOptions;
    }
    if (allOptions.length > limit) {
      return allOptions.slice(0, limit);
    }
    return allOptions;
  };
}

export { getOptionSearcher };
//# sourceMappingURL=getOptionSearcher.js.map
