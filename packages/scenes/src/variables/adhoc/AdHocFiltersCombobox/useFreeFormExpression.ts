import { useCallback, useMemo } from 'react';

import { AdHocFilterWithLabels, isMultiValueOperator } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { parseFilterExpression } from './utils';
import { AdHocInputType } from './AdHocFiltersCombobox';

export interface UseFreeFormExpressionProps {
  controller: AdHocFiltersController;
  filter: AdHocFilterWithLabels | undefined;
  inputValue: string;
  filterInputType: AdHocInputType;
  allowCustomValue: boolean;
  isGroupBy: boolean | undefined;
}

export function useFreeFormExpression({
  controller,
  filter,
  inputValue,
  filterInputType,
  allowCustomValue,
  isGroupBy,
}: UseFreeFormExpressionProps) {
  const operatorValues = controller
    .getOperators()
    .map((o) => o.value)
    .filter((value): value is string => Boolean(value));

  const expressionInputEnabled = allowCustomValue && !isGroupBy && filterInputType !== 'value';

  const parseExpression = useCallback(
    (input: string) => {
      if (!input || !expressionInputEnabled) {
        return null;
      }
      const parsed = parseFilterExpression(input, operatorValues);
      if (!parsed) {
        return null;
      }
      if (filterInputType !== 'operator' && !parsed.key) {
        return null;
      }
      return parsed;
    },
    [expressionInputEnabled, operatorValues, filterInputType]
  );

  const parsedExpression = useMemo(() => parseExpression(inputValue), [parseExpression, inputValue]);
  const canCommitExpressionUpdate = parsedExpression !== null;

  const commitExpressionUpdate = useCallback((): Partial<AdHocFilterWithLabels> | null => {
    if (!parsedExpression || !filter) {
      return null;
    }

    const key = filterInputType === 'operator' ? filter.key : parsedExpression.key;
    const keyLabel = filterInputType === 'operator' ? filter.keyLabel ?? filter.key : parsedExpression.key;
    if (!key) {
      return null;
    }

    const staged: Partial<AdHocFilterWithLabels> = { key, keyLabel, operator: parsedExpression.operator };

    if (!parsedExpression.value) {
      return staged;
    }

    if (isMultiValueOperator(parsedExpression.operator)) {
      const values = parsedExpression.value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      if (!values.length) {
        return staged;
      }

      return { ...staged, value: values[0], values, valueLabels: values };
    }

    return {
      ...staged,
      value: parsedExpression.value,
      valueLabels: [parsedExpression.value],
      values: undefined,
    };
  }, [filter, filterInputType, parsedExpression]);

  return {
    parseExpression,
    canCommitExpressionUpdate,
    commitExpressionUpdate,
  };
}
