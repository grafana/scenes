import React from 'react';
import { t } from '@grafana/i18n';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { BasePill } from './BasePill';

interface GroupByPillProps {
  filter: AdHocFilterWithLabels;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
}

export function GroupByPill({ filter, controller, readOnly, focusOnWipInputRef }: GroupByPillProps) {
  const label = filter.keyLabel ?? filter.key;

  return (
    <BasePill
      readOnly={readOnly}
      onRemove={
        readOnly
          ? undefined
          : () => {
              controller.removeFilter(filter);
              setTimeout(() => focusOnWipInputRef?.());
            }
      }
      removeTooltip={t(
        'grafana-scenes.components.group-by-pill.remove',
        'Remove group by key {{label}}',
        { label }
      )}
    >
      <span>{label}</span>
    </BasePill>
  );
}
