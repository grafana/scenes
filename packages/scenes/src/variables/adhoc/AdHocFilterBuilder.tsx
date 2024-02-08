import React from 'react';

import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFilterSet } from './AdHocFiltersSet';
import { Button, useTheme2 } from '@grafana/ui';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { VariableHide } from '@grafana/schema';

interface Props {
  model: AdHocFilterSet;
}

export function AdHocFilterBuilder({ model }: Props) {
  const theme = useTheme2();
  const { _wip, filters } = model.useState();
  let fixAddButtonSpacing = false;
  const noFilterConfigured = filters.length === 0 && !_wip;

  // When using as a variable, we need to accomodate flex gap with a margin when there is no filters configured yet and the label is hidden
  if (model.parent instanceof AdHocFiltersVariable) {
    fixAddButtonSpacing = noFilterConfigured && model.parent.state.hide !== VariableHide.hideLabel;
  }

  if (!_wip) {
    return (
      <Button
        style={{ marginLeft: fixAddButtonSpacing ? theme.spacing(2) : undefined }}
        variant="secondary"
        icon="plus"
        title={'Add filter'}
        aria-label="Add filter"
        data-testid={`AdHocFilter-add`}
        onClick={() => model._addWip()}
      />
    );
  }

  return <AdHocFilterRenderer filter={_wip} model={model} />;
}
