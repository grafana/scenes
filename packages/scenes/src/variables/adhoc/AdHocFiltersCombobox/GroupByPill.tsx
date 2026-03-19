import React from 'react';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { BasePill } from './BasePill';
import { t } from '@grafana/i18n';

interface Props {
  filter: AdHocFilterWithLabels;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
}

export function GroupByPill({ filter, controller, readOnly, focusOnWipInputRef }: Props) {
  const keyLabel = filter.keyLabel ?? filter.key;

  const handleRemove = () => {
    controller.removeFilter(filter);
    setTimeout(() => focusOnWipInputRef?.());
  };

  return (
    <BasePill
      label={keyLabel}
      readOnly={readOnly}
      onClick={(e) => e.stopPropagation()}
      ariaLabel={t(
        'grafana-scenes.components.group-by-pill.group-by-key',
        'Group by {{keyLabel}}',
        { keyLabel }
      )}
      onRemove={!readOnly ? handleRemove : undefined}
      removeAriaLabel={t(
        'grafana-scenes.components.group-by-pill.remove-group-by-key',
        'Remove group by {{keyLabel}}',
        { keyLabel }
      )}
    />
  );
}
