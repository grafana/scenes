import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton, Tooltip } from '@grafana/ui';
import React, { forwardRef, ReactNode } from 'react';
import { t } from '@grafana/i18n';
import { getNonApplicablePillStyles } from '../../utils';

const LABEL_MAX_VISIBLE_LENGTH = 20;

export interface BasePillProps {
  label: string;
  onRemove?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  readOnly?: boolean;
  disabled?: boolean;
  isFilterReadOnly?: boolean;
  strikethrough?: boolean;
  ariaLabel?: string;
  removeAriaLabel?: string;
  additionalIcons?: ReactNode;
}

export const BasePill = forwardRef<HTMLDivElement, BasePillProps>(function BasePill(
  {
    label,
    onRemove,
    onClick,
    onKeyDown,
    readOnly,
    disabled,
    isFilterReadOnly,
    strikethrough,
    ariaLabel,
    removeAriaLabel,
    additionalIcons,
  },
  ref
) {
  const styles = useStyles2(getStyles);

  const pillText = <span className={cx(styles.pillText, strikethrough && styles.strikethrough)}>{label}</span>;

  return (
    <div
      className={cx(
        styles.combinedFilterPill,
        readOnly && styles.readOnlyCombinedFilter,
        disabled && styles.disabledPill,
        isFilterReadOnly && styles.filterReadOnly
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={readOnly ? undefined : 'button'}
      aria-label={ariaLabel}
      tabIndex={0}
      ref={ref}
    >
      {label.length < LABEL_MAX_VISIBLE_LENGTH ? (
        pillText
      ) : (
        <Tooltip content={<div className={styles.tooltipText}>{label}</div>} placement="top">
          {pillText}
        </Tooltip>
      )}

      {onRemove ? (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          name="times"
          size="md"
          className={cx(styles.pillIcon, disabled && styles.disabledPillIcon)}
          tooltip={removeAriaLabel ?? t('grafana-scenes.components.base-pill.remove', 'Remove {{label}}', { label })}
        />
      ) : null}

      {additionalIcons}
    </div>
  );
});

export const getBasePillStyles = (theme: GrafanaTheme2) => ({
  combinedFilterPill: css({
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
    cursor: 'pointer',

    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  readOnlyCombinedFilter: css({
    paddingRight: theme.spacing(1),
    cursor: 'text',
    '&:hover': {
      background: theme.colors.action.selected,
    },
  }),
  filterReadOnly: css({
    background: theme.colors.background.canvas,
    cursor: 'text',
    '&:hover': {
      background: theme.colors.background.canvas,
    },
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

const getStyles = getBasePillStyles;
