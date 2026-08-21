import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton, Tooltip, Icon } from '@grafana/ui';
import React from 'react';
import { AdHocCombobox } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, FilterOrigin, isMatchAllFilter, ONE_OF_OPERATOR } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { t } from '@grafana/i18n';
import { BasePill } from './BasePill';
import { useEditablePill } from './useEditablePill';

interface Props {
  filter: AdHocFilterWithLabels;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
}

const isAdhocFilterEmpty = (f: AdHocFilterWithLabels) => !f.origin && !f.key && !f.operator && !f.value;

export function AdHocFilterPill({ filter, controller, readOnly, focusOnWipInputRef }: Props) {
  const styles = useStyles2(getStyles);
  const { viewMode, pillWrapperRef, populateInputOnEdit, handleChangeViewMode, handlePillClick, handlePillKeyDown } =
    useEditablePill({ filter, controller, readOnly, focusOnWipInputRef, isFilterEmpty: isAdhocFilterEmpty });

  const keyLabel = filter.keyLabel ?? filter.key;
  const isMatchAll = isMatchAllFilter(filter);
  // A saved All default can arrive without valueLabels, so the sentinel always renders as All
  const isAllValueSelected = filter.operator === ONE_OF_OPERATOR && isMatchAll;
  const valueLabel = isAllValueSelected
    ? t('grafana-scenes.components.adhoc-filter-pill.all-values', 'All')
    : filter.valueLabels?.join(', ') || filter.values?.join(', ') || filter.value;

  const getOriginFilterTooltips = (origin: FilterOrigin): { info: string; restore: string } => {
    if (origin === 'dashboard') {
      return {
        info: 'Applied by default in this dashboard. If edited, it carries over to other dashboards.',
        restore: 'Restore the value set by this dashboard.',
      };
    } else if (origin === 'scope') {
      return {
        info: 'Applied automatically from your selected scope.',
        restore: 'Restore the value set by your selected scope.',
      };
    } else {
      return {
        info: `This is a ${origin} injected filter.`,
        restore: `Restore filter to its original value.`,
      };
    }
  };

  const cleanFilter = !filter.restorable && !filter.readOnly && !filter.nonApplicable;

  if (viewMode) {
    // A match all filter is not narrowing anything, so its value is muted. The key, operator,
    // border and hover stay normal - the pill is still fully interactive.
    const pillTextContent = isMatchAll
      ? `${keyLabel} ${filter.operator}`
      : `${keyLabel} ${filter.operator} ${valueLabel}`;

    const handleRemove = () => {
      if (filter.origin && filter.origin === 'dashboard') {
        controller.updateToMatchAll(filter);
      } else {
        controller.removeFilter(filter);
      }
      setTimeout(() => focusOnWipInputRef?.());
    };

    // Removing a user filter deletes it, so it stays removable even when it matches everything.
    // Removing a dashboard default turns it into a match all one, so there is nowhere left to go
    // once it already is. Derived rather than read off filter.matchAllFilter, because a default
    // authored as All in the editor arrives without the flag.
    const showRemove = !readOnly && (!filter.origin || (filter.origin === 'dashboard' && !isMatchAll));

    return (
      <BasePill
        ref={pillWrapperRef}
        label={pillTextContent}
        mutedValue={isMatchAll ? valueLabel : undefined}
        readOnly={readOnly}
        disabled={filter.nonApplicable}
        isFilterReadOnly={filter.readOnly}
        strikethrough={filter.nonApplicable}
        onClick={handlePillClick}
        onKeyDown={handlePillKeyDown}
        ariaLabel={t(
          'grafana-scenes.components.adhoc-filter-pill.edit-filter-with-key',
          'Edit filter with key {{keyLabel}}',
          { keyLabel }
        )}
        onRemove={handleRemove}
        removeAriaLabel={t(
          'grafana-scenes.components.adhoc-filter-pill.remove-filter-with-key',
          'Remove filter with key {{keyLabel}}',
          { keyLabel }
        )}
        removable={showRemove}
        additionalIcons={
          <>
            {filter.origin && filter.readOnly && (
              <Tooltip
                content={t('grafana-scenes.components.adhoc-filter-pill.managed-filter', '{{origin}} managed filter', {
                  origin: filter.origin,
                })}
                placement={'bottom'}
              >
                <Icon name="lock" size="md" className={styles.readOnlyPillIcon} />
              </Tooltip>
            )}

            {filter.origin && cleanFilter && (
              <Tooltip content={getOriginFilterTooltips(filter.origin).info} placement={'bottom'}>
                <Icon name="info-circle" size="md" className={styles.infoPillIcon} />
              </Tooltip>
            )}

            {filter.origin && filter.restorable && !filter.readOnly && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  controller.restoreOriginalFilter(filter);
                }}
                name="history"
                size="md"
                className={styles.pillIcon}
                tooltip={getOriginFilterTooltips(filter.origin).restore}
              />
            )}

            {filter.nonApplicable && (
              <Tooltip
                content={
                  filter.nonApplicableReason ??
                  t('grafana-scenes.components.adhoc-filter-pill.non-applicable', 'Filter is not applicable')
                }
                placement={'bottom'}
              >
                <Icon name="info-circle" size="md" className={styles.infoPillIcon} />
              </Tooltip>
            )}
          </>
        }
      />
    );
  }

  return (
    <AdHocCombobox
      filter={filter}
      controller={controller}
      handleChangeViewMode={handleChangeViewMode}
      focusOnWipInputRef={focusOnWipInputRef}
      populateInputOnEdit={populateInputOnEdit}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  infoPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
  }),
  readOnlyPillIcon: css({
    marginInline: theme.spacing(0.5),
  }),
  pillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});
