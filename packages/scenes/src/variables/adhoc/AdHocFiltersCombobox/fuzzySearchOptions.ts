import { SelectableValue } from '@grafana/data';
import uFuzzy from '@leeoniya/ufuzzy';

export function fuzzySearchOptions(options: Array<SelectableValue<string>>) {
  const ufuzzy = new uFuzzy();
  const haystack: string[] = [];

  return (search: string) => {
    if (search === '') {
      return options;
    }

    if (haystack.length === 0) {
      for (let i = 0; i < options.length; i++) {
        haystack.push(options[i].label || options[i].value!);
      }
    }

    const idxs = ufuzzy.filter(haystack, search);
    const filteredOptions: Array<SelectableValue<string>> = [];

    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        filteredOptions.push(options[idxs[i]]);
      }

      return filteredOptions;
    }

    return options;
  };
}
