import { forwardRef, useLayoutEffect } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocCombobox } from './AdHocFiltersCombobox';

interface Props {
  model: AdHocFiltersVariable;
}

export const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox(
  { model }: Props,
  // pass ability to focus on input element back to parent
  //    parentRef is coming from AdHocFiltersComboboxRenderer
  //    parentRef is mutated through useImperativeHandle in AdHocCombobox
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
