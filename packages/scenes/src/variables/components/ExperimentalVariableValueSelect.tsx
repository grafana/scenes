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
  const { value, text, key, options, includeAll, isReadOnly, allowCustomValue = true } = state;
  const queryController = sceneGraph.getQueryController(model);

  const comboboxOptions = useMemo<Array<ComboboxOption<string>>>(() => {
    const mapped = [
      ...(includeAll ? [{ value: ALL_VARIABLE_VALUE, label: `${ALL_VARIABLE_TEXT} (variable)` }] : []),
      ...options,
    ].map((o) => ({
      value: String(o.value),
      label: o.label,
      group: o.group,
    }));

    // If current value is not in the options list, surface it so it stays visible.
    if (!isArray(value) && !mapped.some((o) => o.value === String(value))) {
      mapped.unshift({ value: String(value), label: String(text), group: undefined });
    }

    return mapped;
  }, [options, includeAll, value, text]);

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
        // console.log(option);
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
  const { value: rawValue, options, key, includeAll, isReadOnly, allowCustomValue = true } = state;
  const value = isArray(rawValue) ? rawValue : [rawValue];

  const comboboxOptions = useMemo<Array<ComboboxOption<string>>>(
    () =>
      [
        ...(includeAll ? [{ value: ALL_VARIABLE_VALUE, label: `${ALL_VARIABLE_TEXT} (variable)` }] : []),
        ...options,
      ].map((o) => ({
        value: String(o.value),
        label: o.label,
        group: o.group,
      })),
    [includeAll, options]
  );

  // console.log(value);

  return (
    <MultiCombobox<string>
      id={getVariableControlId(model.state.type, key)}
      placeholder={
        options.length > 0
          ? t('grafana-scenes.variables.variable-value-select.placeholder-select-value', 'Select value')
          : ''
      }
      width="auto"
      minWidth={7}
      disabled={isReadOnly}
      value={value}
      enableAllOption={true}
      createCustomValue={allowCustomValue}
      isClearable
      options={comboboxOptions}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${value}`)}
      onChange={(selected: Array<ComboboxOption<string>>) => {
        if (includeAll) {
          console.log('selected', selected);
          console.log('value', value);

          const prevHasAll = [value.at(0), selected.at(-1)].includes(ALL_VARIABLE_VALUE);
          const newHasAll = [selected.at(0).value, selected.at(-1).value].includes(ALL_VARIABLE_VALUE);

          if (prevHasAll && newHasAll) {
          }

          if (newHasAll) {
            model.changeValueTo([ALL_VARIABLE_VALUE], undefined, true);
          }
          // if (selected.length === comboboxOptions.length) {
          //   const optionsWithoutAll = comboboxOptions.slice(1);

          //   model.changeValueTo(optionsWithoutAll, undefined, true);
          //   return;
          // }
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
