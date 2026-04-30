import { t } from '@grafana/i18n';
import { isArray } from 'lodash';
import React, { useMemo } from 'react';
import { Combobox, ComboboxOption, MultiCombobox } from '@grafana/ui';

import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';
import { selectors } from '@grafana/e2e-selectors';
import { sceneGraph } from '../../core/sceneGraph';
import { VARIABLE_VALUE_CHANGED_INTERACTION } from '../../performance/interactionConstants';
import { getVariableControlId } from '../utils';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';

const SELECT_ALL_VARIABLE_VALUE = '$__select__all';

/**
 * @internal Temporary experimental alternative to VariableValueSelect
 * that renders <Combobox /> instead of <Select />. Enable from the variable
 * by setting `UNSAFE_useCombobox: true` on its state.
 */
export function ExperimentalVariableValueSelect({
  model,
  state,
}: {
  model: MultiValueVariable;
  state: MultiValueVariableState;
}) {
  const { value, key, options, includeAll, isReadOnly, allowCustomValue = true } = state;
  const queryController = sceneGraph.getQueryController(model);

  const comboboxOptions = useMemo<Array<ComboboxOption<string>>>(() => {
    const mapped = [...(includeAll ? [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }] : []), ...options].map(
      (o) => ({
        value: String(o.value),
        label: o.label,
        group: o.group,
      })
    );
    return mapped;
  }, [options, includeAll]);

  return (
    <Combobox<string>
      id={getVariableControlId(model.state.type, key)}
      placeholder={t('grafana-scenes.variables.variable-value-select.placeholder-select-value', 'Select value')}
      width="auto"
      minWidth={7}
      disabled={isReadOnly}
      value={String(value)}
      createCustomValue={allowCustomValue}
      options={comboboxOptions}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`)}
      onChange={(option: ComboboxOption<string>) => {
        if (!option) {
          return;
        }

        model.changeValueTo(option.value, option.label ?? option.value, true);
        queryController?.startProfile(VARIABLE_VALUE_CHANGED_INTERACTION);
      }}
    />
  );
}

/**
 * @experimental Multi-value counterpart to ExperimentalVariableValueSelect
 * backed by <MultiCombobox />.
 */
export function ExperimentalVariableValueSelectMulti({
  model,
  state,
}: {
  model: MultiValueVariable;
  state: MultiValueVariableState;
}) {
  const { value: rawValue, options, key, includeAll, isReadOnly, allowCustomValue = true, loading } = state;
  const value = (isArray(rawValue) ? rawValue : [rawValue]) as string[];

  const baseOptions = useMemo<Array<ComboboxOption<string>>>(
    () =>
      [...(includeAll ? [{ value: ALL_VARIABLE_VALUE, label: ALL_VARIABLE_TEXT }] : []), ...options].map((o) => ({
        value: String(o.value),
        label: o.label,
        group: o.group,
      })),
    [includeAll, options]
  );

  const comboboxOptions = useMemo<Array<ComboboxOption<string>>>(
    () => [
      {
        value: SELECT_ALL_VARIABLE_VALUE,
        label: `${t('grafana-scenes.variables.variable-value-select.selected-options', 'Selected')} (${value.length})`,
      },
      ...baseOptions,
    ],
    [baseOptions, value.length]
  );

  return (
    <MultiCombobox<string>
      id={getVariableControlId(model.state.type, key)}
      placeholder={t('grafana-scenes.variables.variable-value-select.placeholder-select-value', 'Select value')}
      width="auto"
      minWidth={7}
      disabled={isReadOnly}
      loading={loading}
      value={value}
      enableAllOption={false}
      createCustomValue={allowCustomValue}
      isClearable
      options={comboboxOptions}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`)}
      onChange={(selected: Array<ComboboxOption<string>>) => {
        if (selected.at(-1)?.value === SELECT_ALL_VARIABLE_VALUE) {
          // Select all logic
          if (value.length < options.length) {
            model.changeValueTo(
              options.map((option) => option.value),
              undefined,
              true
            );
            return;
          }

          // Deselect all path
          model.changeValueTo([], undefined, true);
          return;
        }

        if (includeAll) {
          const prevHasAll = value.at(0) === ALL_VARIABLE_VALUE;
          const newHasAll = selected.at(-1)?.value === ALL_VARIABLE_VALUE;

          // When selecting $__all second time act as Select All
          if (prevHasAll && value.length === 1 && !selected.length) {
            model.changeValueTo(
              options.map((opt) => opt.value),
              undefined,
              true
            );
            return;
          }

          // Handle selecting All ($__all) option
          if (newHasAll) {
            model.changeValueTo([ALL_VARIABLE_VALUE], undefined, true);
            return;
          }
        }

        const normalised = selected.map((option) => option.value);

        model.changeValueTo(normalised, undefined, true);
      }}
    />
  );
}

export function ExperimentalMultiOrSingleValueSelect({ model }: { model: MultiValueVariable }) {
  const state = model.useState();

  if (state.isMulti) {
    return <ExperimentalVariableValueSelectMulti model={model} state={state} />;
  }

  return <ExperimentalVariableValueSelect model={model} state={state} />;
}
