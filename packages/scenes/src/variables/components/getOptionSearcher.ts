import { VariableValueOption } from '../types';
import uFuzzy from '@leeoniya/ufuzzy';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';

export function getOptionSearcher(
  options: VariableValueOption[],
  includeAll: boolean | undefined,
) {
  const ufuzzy = new uFuzzy();
  let allOptions = options;
  const haystack: string[] = [];
  const limit = 10000;

  if (includeAll) {
    allOptions = [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }, ...allOptions];
  }

  return (search: string) => {
    if (search === '') {
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
    const filteredOptions: VariableValueOption[] = [];

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
