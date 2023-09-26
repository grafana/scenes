import React from 'react';

import { AdHocVariableFilter } from '@grafana/data';
import { SegmentAsync } from '@grafana/ui';

import { AdHocFilterSet } from './AdHocFiltersSet';

interface Props {
  model: AdHocFilterSet;
  filter: AdHocVariableFilter;
  placeHolder?: string;
}

export function AdHocFilterValue({ filter, placeHolder, model }: Props) {
  const loadValues = () => model.getValuesFor(filter);

  return (
    <div data-testid="AdHocFilterValue-value-wrapper">
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
