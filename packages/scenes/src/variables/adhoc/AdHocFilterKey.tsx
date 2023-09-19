import React from 'react';

import { SelectableValue } from '@grafana/data';
import { Icon, SegmentAsync } from '@grafana/ui';

import { AdHocFiltersVariable } from './AdHocFiltersVariable';

interface Props {
  filterKey: string | null;
  model: AdHocFiltersVariable;
  onChange: (item: SelectableValue<string | null>) => void;
}

const MIN_WIDTH = 90;
export const AdHocFilterKey = ({ filterKey, model, onChange }: Props) => {
  const loadKeys = () => model._getKeys(filterKey);

  return (
    <div className="gf-form" data-testid="AdHocFilterKey-add-key-wrapper">
      <SegmentAsync
        disabled={model.state.readOnly}
        className="query-segment-key"
        Component={filterKey === null ? plusSegment() : undefined}
        value={filterKey}
        onChange={onChange}
        loadOptions={loadKeys}
        inputMinWidth={MIN_WIDTH}
      />
    </div>
  );
};

const plusSegment = () => (
  <span className="gf-form-label query-part" aria-label="Add Filter">
    <Icon name="plus" />
  </span>
);
