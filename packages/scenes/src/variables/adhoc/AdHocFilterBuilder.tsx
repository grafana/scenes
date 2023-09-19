import React from 'react';

import { AdHocFilterKey } from './AdHocFilterKey';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { ConditionSegment } from './ConditionSegment';

interface Props {
  model: AdHocFiltersVariable;
}

export function AdHocFilterBuilder({ model }: Props) {
  const { filters, _wip } = model.useState();

  if (!_wip) {
    return <AdHocFilterKey model={model} filterKey={null} onChange={(key) => model._addWip(key.value)} />;
  }

  return (
    <>
      {filters.length > 0 && <ConditionSegment label="AND" />}
      <AdHocFilterRenderer filter={_wip} placeHolder={'Select value'} model={model} />
    </>
  );
}
