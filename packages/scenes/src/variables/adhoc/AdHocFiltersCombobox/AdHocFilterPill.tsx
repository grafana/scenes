import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, IconButton, Tooltip, Icon } from '@grafana/ui';
import React from 'react';
import { AdHocCombobox } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, FilterOrigin, isMatchAllFilter } from '../AdHocFiltersVariable';
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
  const valueLabel = filter.valueLabels?.join(', ') || filter.values?.join(', ') || filter.value;

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
    const pillTextContent = `${keyLabel} ${filter.operator} ${valueLabel}`;

    const handleRemove = () => {
      if (filter.origin && filter.origin === 'dashboard') {
        controller.updateToMatchAll(filter);
      } else {
        controller.removeFilter(filter);
      }
      setTimeout(() => focusOnWipInputRef?.());
    };

    const showRemove = !readOnly && !filter.matchAllFilter && (!filter.origin || filter.origin === 'dashboard');

    return (
      <BasePill
        ref={pillWrapperRef}
        label={pillTextContent}
        readOnly={readOnly}
        disabled={isMatchAllFilter(filter) || filter.nonApplicable}
        isFilterReadOnly={filter.readOnly}
        strikethrough={filter.nonApplicable}
        onClick={handlePillClick}
        onKeyDown={handlePillKeyDown}
        ariaLabel={t(
          'grafana-scenes.components.adhoc-filter-pill.edit-filter-with-key',
          'Edit filter with key {{keyLabel}}',
          { keyLabel }
        )}
        onRemove={showRemove ? handleRemove : undefined}
        removeAriaLabel={
          showRemove
            ? t(
                'grafana-scenes.components.adhoc-filter-pill.remove-filter-with-key',
                'Remove filter with key {{keyLabel}}',
                { keyLabel }
              )
            : undefined
        }
        additionalIcons={
          <>
            {filter.origin && filter.readOnly && (
              <Tooltip
                content={t(
                  'grafana-scenes.components.adhoc-filter-pill.managed-filter',
                  '{{origin}} managed filter',
                  { origin: filter.origin }
                )}
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
                className={isMatchAllFilter(filter) ? styles.matchAllPillIcon : styles.pillIcon}
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
  matchAllPillIcon: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    color: theme.colors.text.disabled,
  }),
});
