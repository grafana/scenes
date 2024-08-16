import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton } from '@grafana/ui';
import React, { useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { AdHocCombobox } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';

export function AdHocFiltersComboboxEditSwitch({
  filter,
  model,
}: {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}) {
  const styles = useStyles2(getStyles);
  const [viewMode, setViewMode] = useState(true);
  const pillWrapperRef = useRef<HTMLDivElement>(null);

  const handleChangeViewMode = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    let viewMode = false;
    flushSync(() => {
      setViewMode((mode) => {
        viewMode = mode;
        return !mode;
      });
    });
    if (!viewMode) {
      pillWrapperRef.current?.focus();
    }
  }, []);

  if (viewMode) {
    return (
      <div
        className={styles.combinedFilterPill}
        onClick={handleChangeViewMode}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleChangeViewMode();
          }
        }}
        role="button"
        aria-label={`Edit filter with key ${filter.key}`}
        tabIndex={0}
        ref={pillWrapperRef}
      >
        <span>
          {filter.key} {filter.operator} {filter.value}
        </span>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            model._removeFilter(filter);
          }}
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              model._removeFilter(filter);
            }
          }}
          name="times"
          size="md"
          className={styles.removeButton}
          tooltip={`Remove filter with key ${filter.key}`}
        />
      </div>
    );
  }

  return <AdHocCombobox filter={filter} model={model} handleChangeViewMode={handleChangeViewMode} />;
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
    minHeight: '22px',
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    cursor: 'pointer',

    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});
