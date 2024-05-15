import React from 'react';

import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { Button } from '@grafana/ui';

interface Props {
  model: AdHocFiltersVariable;
  addFilterButtonText?: string;
}

export function AdHocFilterBuilder({ model, addFilterButtonText }: Props) {
  const { _wip } = model.useState();

  if (!_wip) {
    return (
      <Button
        variant="secondary"
        icon="plus"
        title={'Add filter'}
        aria-label="Add filter"
        data-testid={`AdHocFilter-add`}
        onClick={() => model._addWip()}
      >{addFilterButtonText}</Button>
    );
  }

  return <AdHocFilterRenderer filter={_wip} model={model} />;
}
