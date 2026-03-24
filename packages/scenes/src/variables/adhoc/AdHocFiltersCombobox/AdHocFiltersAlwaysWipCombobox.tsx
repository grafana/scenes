import React, { forwardRef, useLayoutEffect } from 'react';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocCombobox } from './AdHocFiltersCombobox';

interface Props {
  controller: AdHocFiltersController;
  onInputClick?: () => void;
  isGroupBy?: boolean;
}

export const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox(
  { controller, onInputClick, isGroupBy }: Props,
  // pass ability to focus on input element back to parent
  //    parentRef is coming from AdHocFiltersComboboxRenderer
  //    parentRef is mutated through useImperativeHandle in AdHocCombobox
  parentRef
) {
  const { wip, groupByWip } = controller.useState();
  const activeWip = isGroupBy ? groupByWip : wip;

  // when combobox is in wip mode then check and add wip if its missing
  //    needed on first render and when wip is reset on filter value commit
  useLayoutEffect(() => {
    if (!activeWip) {
      if (isGroupBy) {
        controller.addGroupByWip?.();
      } else {
        controller.addWip();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWip]);

  return (
    <AdHocCombobox
      controller={controller}
      filter={activeWip}
      isAlwaysWip
      isGroupBy={isGroupBy}
      ref={parentRef}
      onInputClick={onInputClick}
    />
  );
});
