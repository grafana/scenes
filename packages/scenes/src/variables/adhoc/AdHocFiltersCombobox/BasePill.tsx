import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton, Tooltip, Icon } from '@grafana/ui';
import React from 'react';
import { t } from '@grafana/i18n';
import { getNonApplicablePillStyles } from '../../utils';

export interface BasePillProps {
  children: React.ReactNode;
  /** Outer readOnly — hides the remove button and disables pointer interaction */
  readOnly?: boolean;
  /** Grays out the pill (e.g. match-all filter or non-applicable) */
  isDisabled?: boolean;
  /** filter.readOnly — renders with canvas background */
  isFilterLevelReadOnly?: boolean;
  isNonApplicable?: boolean;
  nonApplicableReason?: string;
  /** When provided, a remove (×) button is rendered */
  onRemove?: () => void;
  removeTooltip?: string;
  /** Renders the remove icon in disabled style */
  removeIsDisabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
  pillRef?: React.RefObject<HTMLDivElement>;
  /** Slot for extra icon-buttons rendered between the remove button and the non-applicable icon */
  extraIcons?: React.ReactNode;
}

export function BasePill({
  children,
  readOnly,
  isDisabled,
  isFilterLevelReadOnly,
  isNonApplicable,
  nonApplicableReason,
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
          tooltip={
            removeTooltip ?? t('grafana-scenes.components.base-pill.remove', 'Remove')
          }
        />
      )}

      {extraIcons}

      {isNonApplicable && (
        <Tooltip
          content={
            nonApplicableReason ??
            t('grafana-scenes.components.base-pill.non-applicable', 'Not applicable')
          }
          placement="bottom"
        >
          <Icon name="info-circle" size="md" className={styles.infoPillIcon} />
        </Tooltip>
      )}
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
  pillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  infoPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
  }),
  readOnlyPillIcon: css({
    marginInline: theme.spacing(0.5),
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
