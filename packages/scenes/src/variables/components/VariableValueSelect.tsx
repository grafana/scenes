import { isArray } from 'lodash';
import React from 'react';

import { MultiSelect, Select } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { MultiValueVariable } from '../variants/MultiValueVariable';
import { VariableValue, VariableValueSingle } from '../types';
import { SelectLoadingIndicator } from '../../utils/LoadingIndicator';

export function VariableValueSelect({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, key, loading } = model.useState();

  return (
    <Select<VariableValue, { onCancel: () => void }>
      id={key}
      placeholder="Select value"
      width="auto"
      value={value}
      allowCustomValue
      tabSelectsValue={false}
      isLoading={loading}
      options={model.getOptionsForSelect()}
      onChange={(newValue) => {
        model.changeValueTo(newValue.value!, newValue.label!);
      }}
      onCancel={() => {
        model.cancel?.();
      }}
      components={{ LoadingIndicator: SelectLoadingIndicator }}
    />
  );
}

export function VariableValueSelectMulti({ model }: SceneComponentProps<MultiValueVariable>) {
  const { value, key, loading } = model.useState();
  const arrayValue = isArray(value) ? value : [value];

  return (
    <MultiSelect<VariableValueSingle, { onCancel: () => void }>
      id={key}
      placeholder="Select value"
      width="auto"
      value={arrayValue}
      tabSelectsValue={false}
      allowCustomValue
      isLoading={loading}
      options={model.getOptionsForSelect()}
      closeMenuOnSelect={false}
      isClearable={true}
      onOpenMenu={() => {}}
      onCancel={() => {
        model.cancel?.();
      }}
      components={{ LoadingIndicator: SelectLoadingIndicator }}
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
