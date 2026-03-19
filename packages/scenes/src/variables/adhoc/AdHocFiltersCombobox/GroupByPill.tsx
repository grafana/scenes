import React from 'react';
import { t } from '@grafana/i18n';
import { BasePill } from './BasePill';

interface GroupByPillProps {
  label: string;
  readOnly?: boolean;
  onRemove: () => void;
}

export function GroupByPill({ label, readOnly, onRemove }: GroupByPillProps) {
  return (
    <BasePill
      readOnly={readOnly}
      onRemove={readOnly ? undefined : onRemove}
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
