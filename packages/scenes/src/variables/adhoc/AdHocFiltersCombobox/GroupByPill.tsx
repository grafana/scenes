import { css, cx } from '@emotion/css';
import {
  GrafanaTheme2,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
} from '@grafana/data';
import { useStyles2, IconButton, Tooltip } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { isArray } from 'lodash';
import { getNonApplicablePillStyles } from '../../utils';
import type { GroupByVariable } from '../../groupby/GroupByVariable';
import type { AdHocFiltersController } from '../controller/AdHocFiltersController';

const LABEL_MAX_VISIBLE_LENGTH = 30;

interface GroupByPillProps {
  groupByVariable: GroupByVariable;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
  forceEdit?: boolean;
}

/**
 * A single pill that displays all GroupBy values. Click to enter edit mode
 * where each value is shown as a removable chip (similar to multi-value filter editing).
 */
export function GroupByPill({
  groupByVariable,
  controller,
  readOnly,
  focusOnWipInputRef,
  forceEdit,
}: GroupByPillProps) {
  const { value, text, keysApplicability } = groupByVariable.useState();
  const styles = useStyles2(getStyles);
  const [editMode, setEditMode] = useState(false);
  const pillWrapperRef = useRef<HTMLDivElement>(null);

  const handleEnterEditMode = useCallback(() => {
    if (readOnly) {
      return;
    }
    setEditMode(true);
  }, [readOnly]);

  const handleExitEditMode = useCallback(() => {
    setEditMode(false);
  }, []);

  // Enter edit mode when triggered by keyboard backspace navigation
  useEffect(() => {
    if (forceEdit) {
      setEditMode(true);
      controller.clearForceEditGroupBy?.();
    }
  }, [forceEdit, controller]);

  const values = isArray(value) ? value.map(String).filter((v) => v !== '') : value ? [String(value)] : [];
  const texts = isArray(text) ? text.map(String) : text ? [String(text)] : [];

  // Don't render if there are no GroupBy values
  if (values.length === 0) {
    return null;
  }

  const handleRemoveValue = (key: string) => {
    controller.removeGroupByValue?.(key);
  };

  // Build the display text for view mode
  const displayText = values.map((v, i) => texts[i] ?? v).join(', ');
  const pillTextContent = `Group by: ${displayText}`;

  if (editMode) {
    return (
      <GroupByPillEditMode
        values={values}
        texts={texts}
        keysApplicability={keysApplicability}
        onRemoveValue={handleRemoveValue}
        onExitEditMode={handleExitEditMode}
        onFocusWipInput={focusOnWipInputRef}
        readOnly={readOnly}
      />
    );
  }

  const pillText = <span className={styles.pillText}>{pillTextContent}</span>;

  return (
    <div
      className={cx(styles.groupByPill, readOnly && styles.readOnlyPill)}
      onClick={(e) => {
        e.stopPropagation();
        handleEnterEditMode();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleEnterEditMode();
        }
      }}
      role={readOnly ? undefined : 'button'}
      aria-label={t('grafana-scenes.components.group-by-pill.edit-group-by', 'Edit group by values')}
      tabIndex={0}
      ref={pillWrapperRef}
    >
      {pillTextContent.length < LABEL_MAX_VISIBLE_LENGTH ? (
        pillText
      ) : (
        <Tooltip content={<div className={styles.tooltipText}>{pillTextContent}</div>} placement="top">
          {pillText}
        </Tooltip>
      )}

      {!readOnly && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            // Clear all GroupBy values
            values.forEach((v) => controller.removeGroupByValue?.(v));
            setTimeout(() => focusOnWipInputRef?.());
          }}
          name="times"
          size="md"
          className={styles.pillIcon}
          tooltip={t('grafana-scenes.components.group-by-pill.clear-all', 'Clear all group by values')}
        />
      )}
    </div>
  );
}

/**
 * Edit mode for the GroupBy pill - shows each value as a removable chip.
 * Backspace removes the last chip. Tab exits and focuses the WIP input
 * so the user can start adding a new key (filter or groupBy).
 */
function GroupByPillEditMode({
  values,
  texts,
  keysApplicability,
  onRemoveValue,
  onExitEditMode,
  onFocusWipInput,
  readOnly,
}: {
  values: string[];
  texts: string[];
  keysApplicability?: DrilldownsApplicability[];
  onRemoveValue: (key: string) => void;
  onExitEditMode: () => void;
  onFocusWipInput?: () => void;
  readOnly?: boolean;
}) {
  const styles = useStyles2(getStyles);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  // Focus on mount so keyboard events are captured
  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  // Close edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onExitEditMode();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onExitEditMode]);

  // Close if all values removed
  useEffect(() => {
    if (values.length === 0) {
      onExitEditMode();
      setTimeout(() => onFocusWipInput?.());
    }
  }, [values.length, onExitEditMode, onFocusWipInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && values.length > 0) {
        e.preventDefault();
        onRemoveValue(values[values.length - 1]);
      } else if (e.key === 'Escape') {
        onExitEditMode();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onExitEditMode();
        setTimeout(() => onFocusWipInput?.());
      }
    },
    [values, onRemoveValue, onExitEditMode, onFocusWipInput]
  );

  return (
    <div
      ref={wrapperRef}
      className={styles.editModeWrapper}
      onClick={(e) => {
        e.stopPropagation();
        focusRef.current?.focus();
      }}
    >
      <div ref={focusRef} tabIndex={0} onKeyDown={handleKeyDown} className={styles.focusTrap}>
        <span className={styles.groupByPrefix}>{t('grafana-scenes.components.group-by-pill.prefix', 'Group by:')}</span>
        {values.map((val, idx) => {
          const label = texts[idx] ?? val;
          const applicability = keysApplicability?.find((item: DrilldownsApplicability) => item.key === val);
          const isNonApplicable = applicability && !applicability.applicable;

          return (
            <div key={val} className={cx(styles.valueChip, isNonApplicable && styles.disabledPill)}>
              <span className={cx(styles.chipText, isNonApplicable && styles.strikethrough)}>{label}</span>
              {!readOnly && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveValue(val);
                    focusRef.current?.focus();
                  }}
                  name="times"
                  size="sm"
                  className={styles.chipCloseIcon}
                  tooltip={t('grafana-scenes.components.group-by-pill.remove-value', 'Remove {{label}}', { label })}
                />
              )}
            </div>
          );
        })}
      </div>
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
    cursor: 'pointer',

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
  groupByPrefix: css({
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing(0.5),
    whiteSpace: 'nowrap',
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
    maxWidth: '300px',
    width: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }),
  tooltipText: css({
    textAlign: 'center',
  }),
  editModeWrapper: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.25, 0.5),
    minHeight: theme.spacing(2.75),
  }),
  valueChip: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.pill,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0, 0.5, 0, 1),
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    whiteSpace: 'nowrap',
  }),
  chipText: css({
    marginRight: theme.spacing(0.25),
  }),
  chipCloseIcon: css({
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  focusTrap: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    outline: 'none',
  }),
  ...getNonApplicablePillStyles(theme),
});
