import React, { useCallback } from 'react';
import { SelectableValue } from '@grafana/data';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

interface Props {
  controller: AdHocFiltersController;
}

export function GroupByWipCombobox({ controller }: Props) {
  const { groupBy, groupByInputPlaceholder } = controller.useState();

  const handleKeySelected = useCallback(
    (item: SelectableValue<string>) => {
      const currentValues = groupBy?.current.value ?? [];
      const currentTexts = groupBy?.current.text ?? [];

      if (!currentValues.includes(item.value!)) {
        controller.changeGroupByValue?.(
          [...currentValues, item.value!],
          [...currentTexts, item.label ?? item.value!]
        );
      }
    },
    [controller, groupBy]
  );

  const getOptions = useCallback(
    () => controller.getGroupByOptions?.() ?? Promise.resolve([]),
    [controller]
  );

  return (
    <AdHocFiltersAlwaysWipCombobox
      controller={controller}
      getOptions={getOptions}
      onKeySelected={handleKeySelected}
      inputPlaceholderOverride={groupByInputPlaceholder}
    />
  );
}
