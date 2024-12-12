import uFuzzy from '@leeoniya/ufuzzy';

function getAdhocOptionSearcher(options) {
  const ufuzzy = new uFuzzy();
  const haystack = [];
  const limit = 1e4;
  return (search) => {
    var _a;
    if (search === "") {
      if (options.length > limit) {
        return options.slice(0, limit);
      } else {
        return options;
      }
    }
    if (haystack.length === 0) {
      for (let i = 0; i < options.length; i++) {
        haystack.push((_a = options[i].label) != null ? _a : String(options[i].value));
      }
    }
    const [idxs, info, order] = ufuzzy.search(haystack, search);
    const filteredOptions = [];
    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        if (info && order) {
          const idx = order[i];
          filteredOptions.push(options[idxs[idx]]);
        } else {
          filteredOptions.push(options[idxs[i]]);
        }
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

export { getAdhocOptionSearcher };
//# sourceMappingURL=getAdhocOptionSearcher.js.map
