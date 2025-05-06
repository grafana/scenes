import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton, Tooltip, Icon } from '@grafana/ui';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AdHocCombobox } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, AdHocFiltersVariable, isMatchAllFilter } from '../AdHocFiltersVariable';

const LABEL_MAX_VISIBLE_LENGTH = 20;

interface Props {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
}

export function AdHocFilterPill({ filter, model, readOnly, focusOnWipInputRef }: Props) {
  const styles = useStyles2(getStyles);
  const [viewMode, setViewMode] = useState(true);
  const [shouldFocusOnPillWrapper, setShouldFocusOnPillWrapper] = useState(false);
  const pillWrapperRef = useRef<HTMLDivElement>(null);
  const [populateInputOnEdit, setPopulateInputOnEdit] = useState(false);

  const keyLabel = filter.keyLabel ?? filter.key;
  const valueLabel = filter.valueLabels?.join(', ') || filter.values?.join(', ') || filter.value;

  const handleChangeViewMode = useCallback(
    (event?: React.MouseEvent, shouldFocusOnPillWrapperOverride?: boolean) => {
      event?.stopPropagation();
      if (readOnly) {
        return;
      }

      setShouldFocusOnPillWrapper(shouldFocusOnPillWrapperOverride ?? !viewMode);
      setViewMode(!viewMode);
    },
    [readOnly, viewMode]
  );

  useEffect(() => {
    if (shouldFocusOnPillWrapper) {
      pillWrapperRef.current?.focus();
      setShouldFocusOnPillWrapper(false);
    }
  }, [shouldFocusOnPillWrapper]);

  // set viewMode to false when filter.forceEdit is defined
  useEffect(() => {
    if (filter.forceEdit && viewMode) {
      setViewMode(false);
      // immediately set forceEdit back to undefined as a clean up
      model._updateFilter(filter, { forceEdit: undefined });
    }
  }, [filter, model, viewMode]);

  // reset populateInputOnEdit when pill goes into view mode
  useEffect(() => {
    if (viewMode) {
      setPopulateInputOnEdit((prevValue) => (prevValue ? false : prevValue));
    }
  }, [viewMode]);

  if (viewMode) {
    const pillTextContent = `${keyLabel} ${filter.operator} ${valueLabel}`;
    const pillText = <span className={styles.pillText}>{pillTextContent}</span>;

    return (
      <div
        className={cx(
          styles.combinedFilterPill,
          readOnly && styles.readOnlyCombinedFilter,
          isMatchAllFilter(filter) && styles.matchAllPill,
          filter.readOnly && styles.filterReadOnly
        )}
        onClick={(e) => {
          e.stopPropagation();
          setPopulateInputOnEdit(true);
          handleChangeViewMode();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setPopulateInputOnEdit(true);
            handleChangeViewMode();
          }
        }}
        role={readOnly ? undefined : 'button'}
        aria-label={`Edit filter with key ${keyLabel}`}
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

        {!readOnly && !filter.matchAllFilter && (!filter.origin || filter.origin === 'dashboard') ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (filter.origin && filter.origin === 'dashboard') {
                model.updateToMatchAll(filter);
              } else {
                model._removeFilter(filter);
              }

              setTimeout(() => focusOnWipInputRef?.());
            }}
            onKeyDownCapture={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (filter.origin && filter.origin === 'dashboard') {
                  model.updateToMatchAll(filter);
                } else {
                  model._removeFilter(filter);
                }
                setTimeout(() => focusOnWipInputRef?.());
              }
            }}
            name="times"
            size="md"
            className={styles.pillIcon}
            tooltip={`Remove filter with key ${keyLabel}`}
          />
        ) : null}

        {filter.origin && filter.readOnly && (
          <Tooltip content={`${filter.origin} managed filter`} placement={'bottom'}>
            <Icon name="lock" size="md" className={styles.readOnlyPillIcon} />
          </Tooltip>
        )}

        {filter.origin && !filter.restorable && !filter.readOnly && (
          <Tooltip content={`This is a ${filter.origin} injected filter`} placement={'bottom'}>
            <Icon name="info-circle" size="md" className={styles.infoPillIcon} />
          </Tooltip>
        )}

        {filter.origin && filter.restorable && !filter.readOnly && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              model.restoreOriginalFilter(filter);
            }}
            onKeyDownCapture={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                model.restoreOriginalFilter(filter);
              }
            }}
            name="history"
            size="md"
            className={isMatchAllFilter(filter) ? styles.matchAllPillIcon : styles.pillIcon}
            tooltip={`Restore filter to its original value`}
          />
        )}
      </div>
    );
  }

  return (
    <AdHocCombobox
      filter={filter}
      model={model}
      handleChangeViewMode={handleChangeViewMode}
      focusOnWipInputRef={focusOnWipInputRef}
      populateInputOnEdit={populateInputOnEdit}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
  infoPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
  }),
  readOnlyPillIcon: css({
    marginInline: theme.spacing(0.5),
  }),
  matchAllPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    color: theme.colors.text.disabled,
  }),
  matchAllPill: css({
    background: theme.colors.action.selected,
    color: theme.colors.text.disabled,
    border: 0,
    '&:hover': {
      background: theme.colors.action.selected,
    },
  }),
});
