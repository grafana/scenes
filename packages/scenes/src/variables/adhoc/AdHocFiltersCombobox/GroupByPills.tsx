import React from 'react';
import { isArray } from 'lodash';
import { GroupByPill } from './GroupByPill';
import type { GroupByVariable } from '../../groupby/GroupByVariable';
import type { AdHocFiltersController } from '../controller/AdHocFiltersController';

// @ts-expect-error (temporary till we update grafana/data)
import type { DrilldownsApplicability } from '@grafana/data';

interface GroupByPillsProps {
  groupByVariable: GroupByVariable;
  controller: AdHocFiltersController;
  readOnly?: boolean;
}

/**
 * Renders GroupBy values as pills inside the AdHoc combobox renderer.
 * This is a separate component so we can safely call useState() on GroupByVariable
 * without violating the React hooks rules (no conditional hooks).
 */
export function GroupByPills({ groupByVariable, controller, readOnly }: GroupByPillsProps) {
  const { value, text, keysApplicability } = groupByVariable.useState();

  const values = isArray(value) ? value.map(String) : value ? [String(value)] : [];
  const texts = isArray(text) ? text.map(String) : text ? [String(text)] : [];

  // Don't render anything if there are no GroupBy values
  if (values.length === 0 || (values.length === 1 && values[0] === '')) {
    return null;
  }

  const handleRemove = (key: string) => {
    controller.removeGroupByValue?.(key);
  };

  return (
    <>
      {values
        .filter((v) => v !== '')
        .map((val, idx) => {
          const label = texts[idx] ?? val;
          const applicability = keysApplicability?.find((item: DrilldownsApplicability) => item.key === val);

          return (
            <GroupByPill
              key={`groupby-${val}`}
              value={val}
              label={label}
              readOnly={readOnly}
              applicability={applicability}
              onRemove={handleRemove}
            />
          );
        })}
    </>
  );
}
