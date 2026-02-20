import { css, cx } from '@emotion/css';
import {
  GrafanaTheme2,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
} from '@grafana/data';
import { useStyles2, IconButton, Tooltip, Icon } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React from 'react';
import { getNonApplicablePillStyles } from '../../utils';

const LABEL_MAX_VISIBLE_LENGTH = 20;

interface GroupByPillProps {
  /** The groupBy key value (e.g., "hostname") */
  value: string;
  /** The display label for the key */
  label: string;
  /** Whether this pill is read-only */
  readOnly?: boolean;
  /** Applicability info for this key */
  applicability?: DrilldownsApplicability;
  /** Callback to remove this groupBy value */
  onRemove?: (key: string) => void;
}

export function GroupByPill({ value, label, readOnly, applicability, onRemove }: GroupByPillProps) {
  const styles = useStyles2(getStyles);

  const isNonApplicable = applicability && !applicability.applicable;
  const nonApplicableReason = applicability?.reason;

  const pillTextContent = label;
  const pillText = (
    <span className={cx(styles.pillText, isNonApplicable && styles.strikethrough)}>{pillTextContent}</span>
  );

  return (
    <div
      className={cx(styles.groupByPill, isNonApplicable && styles.disabledPill, readOnly && styles.readOnlyPill)}
      role={readOnly ? undefined : 'button'}
      aria-label={t('grafana-scenes.components.group-by-pill.group-by-key', 'Group by {{label}}', { label })}
      tabIndex={0}
    >
      <Icon name="arrow-to-right" size="sm" className={styles.groupByIcon} />

      {pillTextContent.length < LABEL_MAX_VISIBLE_LENGTH ? (
        pillText
      ) : (
        <Tooltip content={<div className={styles.tooltipText}>{pillTextContent}</div>} placement="top">
          {pillText}
        </Tooltip>
      )}

      {!readOnly && onRemove ? (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove(value);
          }}
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              onRemove(value);
            }
          }}
          name="times"
          size="md"
          className={cx(styles.pillIcon, isNonApplicable && styles.disabledPillIcon)}
          tooltip={t('grafana-scenes.components.group-by-pill.remove-group-by', 'Remove group by {{label}}', { label })}
        />
      ) : null}

      {isNonApplicable && (
        <Tooltip
          content={
            nonApplicableReason ??
            t('grafana-scenes.components.group-by-pill.non-applicable', 'Group by is not applicable')
          }
          placement="bottom"
        >
          <Icon name="info-circle" size="md" className={styles.infoPillIcon} />
        </Tooltip>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  groupByPill: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 0, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: theme.spacing(2.75),
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    cursor: 'default',

    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  readOnlyPill: css({
    paddingRight: theme.spacing(1),
    cursor: 'text',
    '&:hover': {
      background: theme.colors.action.selected,
    },
  }),
  groupByIcon: css({
    color: theme.colors.text.secondary,
    marginRight: theme.spacing(0.5),
    flexShrink: 0,
  }),
  pillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  pillText: css({
    maxWidth: '200px',
    width: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }),
  tooltipText: css({
    textAlign: 'center',
  }),
  infoPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
  }),
  disabledPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    color: theme.colors.text.disabled,
    '&:hover': {
      color: theme.colors.text.disabled,
    },
  }),
  ...getNonApplicablePillStyles(theme),
});
