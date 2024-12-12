import React from 'react';
import { AdHocFilterRenderer } from './AdHocFilterRenderer.js';
import { Button } from '@grafana/ui';

function AdHocFilterBuilder({ model, addFilterButtonText }) {
  const { _wip } = model.useState();
  if (!_wip) {
    return /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      icon: "plus",
      title: "Add filter",
      "aria-label": "Add filter",
      "data-testid": `AdHocFilter-add`,
      onClick: () => model._addWip()
    }, addFilterButtonText);
  }
  return /* @__PURE__ */ React.createElement(AdHocFilterRenderer, {
    filter: _wip,
    model
  });
}

export { AdHocFilterBuilder };
//# sourceMappingURL=AdHocFilterBuilder.js.map
