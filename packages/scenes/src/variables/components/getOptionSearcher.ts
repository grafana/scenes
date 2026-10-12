import { t } from '@grafana/i18n';

import { VariableValueOption } from '../types';
import { ALL_VARIABLE_VALUE } from '../constants';
import { fuzzyFind } from '../filter';

export function getOptionSearcher(options: VariableValueOption[], includeAll = false) {
  let allOptions = options;

  if (includeAll) {
    allOptions = [
      { value: ALL_VARIABLE_VALUE, label: t('grafana-scenes.variables.variable-value-select.all-label', 'All') },
      ...allOptions,
    ];
  }

  const haystack = allOptions.map((o) => o.label);

  return (search: string) => fuzzyFind<VariableValueOption>(allOptions, haystack, search);
}
