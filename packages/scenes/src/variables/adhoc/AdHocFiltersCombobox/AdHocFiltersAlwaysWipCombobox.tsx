import React, { forwardRef, useLayoutEffect } from 'react';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocCombobox } from './AdHocFiltersCombobox';

interface Props {
  controller: AdHocFiltersController;
  onInputClick?: () => void;
}

export const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox(
  { controller, onInputClick }: Props,
  // pass ability to focus on input element back to parent
  //    parentRef is coming from AdHocFiltersComboboxRenderer
  //    parentRef is mutated through useImperativeHandle in AdHocCombobox
  parentRef
) {
  const { wip } = controller.useState();

  // when combobox is in wip mode then check and add wip if its missing
  //    needed on first render and when wip is reset on filter value commit
  useLayoutEffect(() => {
    if (!wip) {
      controller.addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wip]);

  return <AdHocCombobox controller={controller} filter={wip} isAlwaysWip ref={parentRef} onInputClick={onInputClick} />;
});
