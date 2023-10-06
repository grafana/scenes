import { isArray } from 'lodash';
import React from 'react';

import { InputActionMeta, MultiSelect, Select } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { MultiValueVariable } from '../variants/MultiValueVariable';
import { VariableValue, VariableValueSingle } from '../types';

export function VariableValueSelect({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, key } = model.useState();

  const onInputChange = model.onSearchChange
    ? (value: string, meta: InputActionMeta) => {
        if (meta.action === 'input-change') {
          model.onSearchChange!(value);
        }
      }
    : undefined;

  return (
    <Select<VariableValue>
      id={key}
      placeholder="Select value"
      width="auto"
      value={value}
      allowCustomValue
      tabSelectsValue={false}
      onInputChange={onInputChange}
      options={model.getOptionsForSelect()}
      onChange={(newValue) => {
        model.changeValueTo(newValue.value!, newValue.label!);
      }}
    />
  );
}

export function VariableValueSelectMulti({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, key } = model.useState();
  const arrayValue = isArray(value) ? value : [value];

  const onInputChange = model.onSearchChange
    ? (value: string, meta: InputActionMeta) => {
        if (meta.action === 'input-change') {
          model.onSearchChange!(value);
        }
      }
    : undefined;

  return (
    <MultiSelect<VariableValueSingle>
      id={key}
      placeholder="Select value"
      width="auto"
      value={arrayValue}
      tabSelectsValue={false}
      allowCustomValue
      options={model.getOptionsForSelect()}
      closeMenuOnSelect={false}
      isClearable={true}
      onInputChange={onInputChange}
      onChange={(newValue) => {
        model.changeValueTo(
          newValue.map((v) => v.value!),
          newValue.map((v) => v.label!)
        );
      }}
    />
  );
}

export function renderSelectForVariable(model: MultiValueVariable) {
  if (model.state.isMulti) {
    return <VariableValueSelectMulti model={model} />;
  } else {
    return <VariableValueSelect model={model} />;
  }
}
