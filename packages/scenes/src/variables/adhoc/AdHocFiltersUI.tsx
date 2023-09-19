import React from 'react';

import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { ConditionSegment } from './ConditionSegment';
import { SceneComponentProps } from '../../core/types';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

export function AdHocFiltersUI({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly } = model.useState();

  return (
    <div className="gf-form-inline">
      {filters.map((filter, index) => (
        <>
          {index > 0 && <ConditionSegment label="AND" key={`condition-${index}`} />}
          <AdHocFilterRenderer filter={filter} model={model} />
        </>
      ))}

      {!readOnly && <AdHocFilterBuilder model={model} />}
    </div>
  );
}
