import React, { forwardRef, useLayoutEffect } from 'react';
import { SelectableValue } from '@grafana/data';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocCombobox } from './AdHocFiltersCombobox';

const EMPTY_FILTER: AdHocFilterWithLabels = { key: '', keyLabel: '', operator: '', value: '', condition: '' };

interface Props {
  controller: AdHocFiltersController;
  onInputClick?: () => void;
  /** When provided, called on key selection and normal operator/value flow is skipped */
  onKeySelected?: (item: SelectableValue<string>) => void;
  /** When provided, replaces controller.getKeys() for the key step */
  getOptions?: () => Promise<Array<SelectableValue<string>>>;
}

export const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox(
  { controller, onInputClick, onKeySelected, getOptions }: Props,
  // pass ability to focus on input element back to parent
  //    parentRef is coming from AdHocFiltersComboboxRenderer
  //    parentRef is mutated through useImperativeHandle in AdHocCombobox
  parentRef
) {
  const { wip } = controller.useState();

  // when combobox is in wip mode then check and add wip if its missing
  //    needed on first render and when wip is reset on filter value commit
  //    skip when onKeySelected is provided (group-by mode) — those use a local filter
  //    so they don't interfere with the regular filter _wip state
  useLayoutEffect(() => {
    if (!onKeySelected && !wip) {
      controller.addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wip]);

  return (
    <AdHocCombobox
      controller={controller}
      filter={onKeySelected ? EMPTY_FILTER : wip}
      isAlwaysWip
      ref={parentRef}
      onInputClick={onInputClick}
      onKeySelected={onKeySelected}
      getOptions={getOptions}
    />
  );
});
