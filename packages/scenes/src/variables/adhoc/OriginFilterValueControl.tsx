import { t } from '@grafana/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { isEqual } from 'lodash';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { IconButton, InputActionMeta, MultiSelect, Select, useStyles2 } from '@grafana/ui';

import { ControlsLabel } from '../../utils/ControlsLabel';
import { OptionWithCheckbox } from '../components/VariableValueSelect';
import { getVariableControlId, handleOptionGroups } from '../utils';
import { AdHocFiltersVariable, AdHocFilterWithLabels, isMatchAllFilter } from './AdHocFiltersVariable';
import { getAdhocOptionSearcher } from './getAdhocOptionSearcher';

interface Props {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

const filterNoOp = () => true;

function getSelectedOptions(filter: AdHocFilterWithLabels): Array<SelectableValue<string>> {
  if (isMatchAllFilter(filter)) {
    return [];
  }

  const values = filter.values ?? (filter.value !== '' ? [filter.value] : []);

  return values.map((value, index) => ({
    value,
    label: filter.valueLabels?.[index] ?? value,
  }));
}

/**
 * Renders a dashboard-origin filter as a standalone, labeled, value-only control.
 * The value picker reuses the same Select/MultiSelect components (and commit-on-blur
 * semantics) as the classic variable value selects, so the control looks and behaves
 * like a regular template variable picker. Clearing the selection puts the filter in
 * the match-all state ("All").
 */
export function OriginFilterValueControl({ filter, model }: Props) {
  const styles = useStyles2(getStyles);
  const { supportsMultiValueOperators, readOnly, allowCustomValue = true } = model.useState();

  const [values, setValues] = useState<SelectableValue[]>([]);
  const [isValuesLoading, setIsValuesLoading] = useState(false);
  const [isValuesOpen, setIsValuesOpen] = useState(false);
  const [valueInputValue, setValueInputValue] = useState('');

  const selectedOptions = useMemo(() => getSelectedOptions(filter), [filter]);
  // To not trigger queries on every selection we store the selection locally and only commit onBlur
  const [uncommittedValue, setUncommittedValue] = useState<Array<SelectableValue<string>>>(selectedOptions);

  // Detect value changes outside (e.g. restore, clear all, URL sync)
  useEffect(() => {
    setUncommittedValue(selectedOptions);
  }, [selectedOptions]);

  const optionSearcher = useMemo(() => getAdhocOptionSearcher(values), [values]);
  const filteredOptions = useMemo(
    () => handleOptionGroups(optionSearcher(valueInputValue)),
    [optionSearcher, valueInputValue]
  );

  const inputId = `${getVariableControlId(model.state.type, model.state.key)}-origin-${filter.key}`;
  const label = filter.keyLabel ?? filter.key;
  const disabled = readOnly || filter.nonApplicable;

  const commitOptions = (options: Array<SelectableValue<string>>, operator: string) => {
    if (options.length === 0) {
      if (!isMatchAllFilter(filter)) {
        model.updateToMatchAll(filter);
      }
      return;
    }

    const newValues = options.map((option) => option.value!);
    const newLabels = options.map((option) => option.label ?? option.value!);
    const currentValues = isMatchAllFilter(filter) ? [] : filter.values ?? [filter.value];

    // Unchanged selection: don't touch the filter (also preserves an authored single-value operator)
    if (isEqual(newValues, currentValues)) {
      return;
    }

    model._updateFilter(filter, {
      operator,
      value: newValues[0],
      values: newValues,
      valueLabels: newLabels,
    });
  };

  const onInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setValueInputValue(value);
    }
    return value;
  };

  const commonSelectProps = {
    inputId,
    width: 'auto' as const,
    virtualized: true,
    disabled,
    allowCustomValue,
    isValidNewOption: (inputValue: string) => inputValue.trim().length > 0,
    allowCreateWhileLoading: true,
    placeholder: t('grafana-scenes.variables.origin-filter-value-control.placeholder-all', 'All'),
    options: filteredOptions,
    inputValue: valueInputValue,
    onInputChange,
    filterOption: filterNoOp,
    isClearable: true,
    // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded
    // asynchronously, so we explicitly control the menu visibility until the options have fully loaded
    isOpen: isValuesOpen && !isValuesLoading,
    isLoading: isValuesLoading,
    onOpenMenu: async () => {
      setIsValuesLoading(true);
      setIsValuesOpen(true);
      const values = await model._getValuesFor(filter);
      setIsValuesLoading(false);
      setValues(values);
    },
    onCloseMenu: () => {
      setIsValuesOpen(false);
      setValueInputValue('');
    },
    'data-testid': `origin-filter-value-${filter.key}`,
  };

  const valueSelect = supportsMultiValueOperators ? (
    <MultiSelect<string>
      {...commonSelectProps}
      value={uncommittedValue}
      noMultiValueWrap={true}
      maxVisibleValues={5}
      tabSelectsValue={false}
      components={{ Option: OptionWithCheckbox }}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      blurInputOnSelect={false}
      onChange={(newValue) => {
        setUncommittedValue(newValue.map((option) => ({ value: option.value, label: option.label ?? option.value })));
        // clear input value when creating a new custom multi value
        if (newValue.some((option) => option.__isNew__)) {
          setValueInputValue('');
        }
      }}
      onBlur={() => {
        commitOptions(uncommittedValue, '=|');
      }}
    />
  ) : (
    <Select<string>
      {...commonSelectProps}
      value={selectedOptions[0] ?? null}
      onChange={(newValue) => {
        commitOptions(newValue && newValue.value != null ? [newValue] : [], '=');
      }}
    />
  );

  const restoreButton = filter.restorable ? (
    <IconButton
      name="history"
      size="sm"
      tooltip={t(
        'grafana-scenes.variables.origin-filter-value-control.restore-tooltip',
        'Restore the filter set by this dashboard.'
      )}
      onClick={() => model.restoreOriginalFilter(filter)}
    />
  ) : undefined;

  return (
    <div className={styles.container} data-testid={`origin-filter-control-${filter.key}`}>
      <ControlsLabel htmlFor={inputId} label={label} suffix={restoreButton} />
      {valueSelect}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    // No left border radius for the select as the label and select share a border
    '> :nth-child(2)': css({
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    }),
  }),
});
