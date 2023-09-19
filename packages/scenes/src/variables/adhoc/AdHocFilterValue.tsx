import React from 'react';

import { AdHocVariableFilter } from '@grafana/data';
import { SegmentAsync } from '@grafana/ui';

import { AdHocFiltersVariable } from './AdHocFiltersVariable';

interface Props {
  model: AdHocFiltersVariable;
  filter: AdHocVariableFilter;
  placeHolder?: string;
}

export function AdHocFilterValue({ filter, placeHolder, model }: Props) {
  const loadValues = () => model._getValuesFor(filter);

  return (
    <div className="gf-form" data-testid="AdHocFilterValue-value-wrapper">
      <SegmentAsync
        className="query-segment-value"
        disabled={model.state.readOnly}
        placeholder={placeHolder}
        value={filter.value}
        onChange={(v) => model._updateFilter(filter, 'value', v.value)}
        loadOptions={loadValues}
      />
    </div>
  );
}
