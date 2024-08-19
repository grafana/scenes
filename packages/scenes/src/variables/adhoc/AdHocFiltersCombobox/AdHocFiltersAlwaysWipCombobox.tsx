import React, { forwardRef, useLayoutEffect } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocCombobox } from './AdHocFiltersCombobox';

export const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox(
  {
    model,
  }: {
    model: AdHocFiltersVariable;
  },
  parentRef
) {
  const { _wip } = model.useState();

  // when combobox is in wip mode then check and add _wip if its missing
  //    needed on first render and when _wip is reset on filter value commit
  useLayoutEffect(() => {
    if (!_wip) {
      model._addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wip]);

  return <AdHocCombobox model={model} filter={_wip} isAlwaysWip ref={parentRef} />;
});
