import { SelectableValue } from '@grafana/data';
import { getFuzzySearcher } from '../utils';

export function getAdhocOptionSearcher(options: SelectableValue[]) {
  const haystack = options.map((o) => o.label ?? String(o.value));
  const fuzzySearch = getFuzzySearcher(haystack);

  return (search: string) => fuzzySearch(search).map((i) => options[i]);
}
