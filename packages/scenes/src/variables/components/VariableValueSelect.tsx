import { isArray } from 'lodash';
import React, { useCallback } from 'react';

import { Icon, MultiSelect, Select, Tooltip } from '@grafana/ui';
import { LoadingIndicatorProps } from 'react-select';

import { SceneComponentProps } from '../../core/types';
import { MultiValueVariable } from '../variants/MultiValueVariable';
import { selectors } from '@grafana/e2e-selectors';
import { VariableValue, VariableValueSingle } from '../types';


const LoadingIndicator = ({ innerProps, ...props }: LoadingIndicatorProps & { selectProps: { onCancel: () => void }}) => {
  const { onCancel } = props.selectProps;
  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    },
    [onCancel]
  );

  return (
    <Tooltip content="Cancel query">
      <Icon
        className="spin-clockwise"
        name="sync"
        size="xs"
        aria-label={selectors.components.LoadingIndicator.icon}
        role="button"
        onMouseDown={onMouseDown}
      />
    </Tooltip>
  );
};

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
      onCancel={() => { model.cancel?.() }}
      components={{ LoadingIndicator }}
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
      onCancel={() => { model.cancel?.() }}
      components={{ LoadingIndicator }}
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
