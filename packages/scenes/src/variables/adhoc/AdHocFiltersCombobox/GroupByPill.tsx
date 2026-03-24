import React from 'react';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
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
  const { viewMode, pillWrapperRef, populateInputOnEdit, handleChangeViewMode, handlePillClick, handlePillKeyDown } =
    useEditablePill({ filter, controller, readOnly, focusOnWipInputRef, isFilterEmpty: isGroupByFilterEmpty });

  const keyLabel = filter.keyLabel ?? filter.key;

  const handleRemove = () => {
    controller.removeFilter(filter);
    setTimeout(() => focusOnWipInputRef?.());
  };

  if (viewMode) {
    return (
      <BasePill
        ref={pillWrapperRef}
        label={keyLabel}
        readOnly={readOnly}
        onClick={handlePillClick}
        onKeyDown={handlePillKeyDown}
        ariaLabel={t('grafana-scenes.components.group-by-pill.group-by-key', 'Group by {{keyLabel}}', { keyLabel })}
        onRemove={!readOnly ? handleRemove : undefined}
        removeAriaLabel={t(
          'grafana-scenes.components.group-by-pill.remove-group-by-key',
          'Remove group by {{keyLabel}}',
          { keyLabel }
        )}
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
