import uFuzzy from '@leeoniya/ufuzzy';
import { SelectableValue } from '@grafana/data';

export function getAdhocOptionSearcher(
  options: SelectableValue[],
) {
  const ufuzzy = new uFuzzy();
  const haystack: string[] = [];
  const limit = 10000;

  return (search: string) => {
    if (search === '') {
      if (options.length > limit) {
        return options.slice(0, limit);
      } else {
        return options;
      }
    }

    if (haystack.length === 0) {
      for (let i = 0; i < options.length; i++) {
        haystack.push(options[i].label ?? String(options[i].value));
      }
    }

    const idxs = ufuzzy.filter(haystack, search);
    const filteredOptions: SelectableValue[] = [];

    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        filteredOptions.push(options[idxs[i]]);

        if (filteredOptions.length > limit) {
          return filteredOptions;
        }
      }

      return filteredOptions;
    }

    if (options.length > limit) {
      return options.slice(0, limit);
    }

    return options;
  };
}
