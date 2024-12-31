import { getFuzzySearcher } from '../utils.js';

function getAdhocOptionSearcher(options) {
  const haystack = options.map((o) => {
    var _a;
    return (_a = o.label) != null ? _a : String(o.value);
  });
  const fuzzySearch = getFuzzySearcher(haystack);
  return (search) => fuzzySearch(search).map((i) => options[i]);
}

export { getAdhocOptionSearcher };
//# sourceMappingURL=getAdhocOptionSearcher.js.map
