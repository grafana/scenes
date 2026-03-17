import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton } from '@grafana/ui';
import React from 'react';
import { t } from '@grafana/i18n';

export interface BasePillProps {
  children: React.ReactNode;
  /** When true, the pill cannot be edited or removed */
  readOnly?: boolean;
  /** Renders the pill in a disabled/greyed-out style */
  isDisabled?: boolean;
  /** Renders with canvas background (filter-level readOnly) */
  isFilterLevelReadOnly?: boolean;
  /** When provided, renders a × remove button */
  onRemove?: () => void;
  removeTooltip?: string;
  /** Renders the remove button in disabled style */
  removeIsDisabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
  pillRef?: React.RefObject<HTMLDivElement>;
  /** Extra icon-buttons rendered after the remove button */
  extraIcons?: React.ReactNode;
}

export function BasePill({
  children,
  readOnly,
  isDisabled,
  isFilterLevelReadOnly,
  onRemove,
  removeTooltip,
  removeIsDisabled,
  onClick,
  onKeyDown,
  role,
  ariaLabel,
  tabIndex,
  pillRef,
  extraIcons,
}: BasePillProps) {
  const styles = useStyles2(getBasePillStyles);

  return (
    <div
      className={cx(
        styles.combinedFilterPill,
        readOnly && styles.readOnlyCombinedFilter,
        isDisabled && styles.disabledPill,
        isFilterLevelReadOnly && styles.filterReadOnly
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      ref={pillRef}
    >
      {children}

      {onRemove && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }
          }}
          name="times"
          size="md"
          className={cx(styles.pillIcon, removeIsDisabled && styles.disabledPillIcon)}
          tooltip={removeTooltip ?? t('grafana-scenes.components.base-pill.remove', 'Remove')}
        />
      )}

      {extraIcons}
    </div>
  );
}

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
  disabledPill: css({
    background: theme.colors.action.selected,
    color: theme.colors.text.disabled,
    border: 0,
    '&:hover': {
      background: theme.colors.action.selected,
    },
  }),
  pillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  disabledPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    color: theme.colors.text.disabled,
    '&:hover': {
      color: theme.colors.text.disabled,
    },
  }),
});
