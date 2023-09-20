import React from 'react';

import { AdHocFilterKey } from './AdHocFilterKey';
import { AdHocFilterValue } from './AdHocFilterValue';
import { OperatorSegment } from './OperatorSegment';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { AdHocVariableFilter } from '@grafana/data';
import { Icon } from '@grafana/ui';

interface Props {
  filter: AdHocVariableFilter;
  model: AdHocFiltersVariable;
  placeHolder?: string;
}

export function AdHocFilterRenderer({ filter, placeHolder, model }: Props) {
  return (
    <>
      <AdHocFilterKey
        model={model}
        filterKey={filter.key}
        onChange={(value) => model._updateFilter(filter, 'key', value.value)}
      />
      <div className="gf-form">
        <OperatorSegment
          disabled={model.state.readOnly}
          value={filter.operator}
          onChange={(op) => model._updateFilter(filter, 'operator', op.value)}
        />
      </div>
      <AdHocFilterValue filter={filter} model={model} placeHolder={placeHolder} />
      <button
        className="gf-form-label query-part"
        aria-label="Remove filter"
        data-testid={`AdHocFilter-remove-${filter.key ?? ''}`}
        onClick={() => model._removeFilter(filter)}
      >
        <Icon name="times" />
      </button>
    </>
  );
}