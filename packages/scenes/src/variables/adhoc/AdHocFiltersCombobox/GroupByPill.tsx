import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { reportInteraction } from '@grafana/runtime';
import { AdHocCombobox } from './AdHocFiltersCombobox';
import { BasePill } from './BasePill';
import { useEditablePill } from './useEditablePill';
import { t } from '@grafana/i18n';

interface Props {
  filter: AdHocFilterWithLabels;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
}

const isGroupByFilterEmpty = (f: AdHocFilterWithLabels) => !f.key;

export function GroupByPill({ filter, controller, readOnly, focusOnWipInputRef }: Props) {
  const styles = useStyles2(getStyles);
  const { viewMode, pillWrapperRef, populateInputOnEdit, handleChangeViewMode, handlePillClick, handlePillKeyDown } =
    useEditablePill({ filter, controller, readOnly, focusOnWipInputRef, isFilterEmpty: isGroupByFilterEmpty });

  const keyLabel = filter.keyLabel ?? filter.key;

  const handleRemove = () => {
    if (filter.origin && filter.origin === 'dashboard') {
      controller.updateToMatchAll(filter);
      reportInteraction('grafana_unified_drilldown_groupby_removed', { key: filter.key, origin: filter.origin });
    } else {
      controller.removeFilter(filter);
      reportInteraction('grafana_unified_drilldown_groupby_removed', { key: filter.key });
    }
    setTimeout(() => focusOnWipInputRef?.());
  };

  const isCleanDefault = filter.origin && !filter.restorable && !filter.readOnly;

  if (viewMode) {
    return (
      <BasePill
        ref={pillWrapperRef}
        label={keyLabel}
        readOnly={readOnly}
        onClick={handlePillClick}
        onKeyDown={handlePillKeyDown}
        ariaLabel={t('grafana-scenes.components.group-by-pill.group-by-key', 'Group by {{keyLabel}}', { keyLabel })}
        onRemove={handleRemove}
        removable={!readOnly}
        removeAriaLabel={t(
          'grafana-scenes.components.group-by-pill.remove-group-by-key',
          'Remove group by {{keyLabel}}',
          { keyLabel }
        )}
        additionalIcons={
          <>
            {isCleanDefault && (
              <Tooltip
                content={t(
                  'grafana-scenes.components.group-by-pill.applied-by-default',
                  'Applied by default in this dashboard. If edited, it carries over to other dashboards.'
                )}
                placement="bottom"
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
      isGroupBy
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
});
