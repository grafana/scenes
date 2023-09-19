import React from 'react';

import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { ConditionSegment } from './ConditionSegment';
import { SceneComponentProps } from '../../core/types';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

export function AdHocFiltersUI({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly } = model.useState();

  return (
    <div className="gf-form-inline" style={{ paddingLeft: 4 }}>
      {filters.map((filter, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ConditionSegment label="AND" />}
          <AdHocFilterRenderer filter={filter} model={model} />
        </React.Fragment>
      ))}

      {!readOnly && <AdHocFilterBuilder model={model} key="'builder" />}
    </div>
  );
}
