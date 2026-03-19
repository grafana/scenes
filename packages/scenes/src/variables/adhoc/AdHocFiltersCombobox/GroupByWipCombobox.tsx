import React, { useCallback } from 'react';
import { SelectableValue } from '@grafana/data';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

interface Props {
  controller: AdHocFiltersController;
}

export function GroupByWipCombobox({ controller }: Props) {
  const getOptions = useCallback(
    () => controller.getGroupByOptions?.() ?? Promise.resolve([]),
    [controller]
  );

  const onKeySelected = useCallback(
    (item: SelectableValue<string>) => {
      controller.addGroupByFilter?.(item.value!, item.label ?? item.value!);
    },
    [controller]
  );

  return (
    <AdHocFiltersAlwaysWipCombobox
      controller={controller}
      getOptions={getOptions}
      onKeySelected={onKeySelected}
    />
  );
}
