import React, { forwardRef, useLayoutEffect } from 'react';
import { AdHocCombobox } from './AdHocFiltersCombobox.js';

const AdHocFiltersAlwaysWipCombobox = forwardRef(function AdHocFiltersAlwaysWipCombobox2({ model }, parentRef) {
  const { _wip } = model.useState();
  useLayoutEffect(() => {
    if (!_wip) {
      model._addWip();
    }
  }, [_wip]);
  return /* @__PURE__ */ React.createElement(AdHocCombobox, {
    model,
    filter: _wip,
    isAlwaysWip: true,
    ref: parentRef
  });
});

export { AdHocFiltersAlwaysWipCombobox };
//# sourceMappingURL=AdHocFiltersAlwaysWipCombobox.js.map
