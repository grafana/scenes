import React, { useCallback } from 'react';

import { AutoSizeInput } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { TextBoxVariable } from '../variants/TextBoxVariable';

export function VariableValueInput({ model }: SceneComponentProps<TextBoxVariable>) {
  const { value, key, loading } = model.useState();

  const onBlur = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      model.setValue(e.currentTarget.value);
    },
    [model]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        model.setValue(e.currentTarget.value);
      }
    },
    [model]
  );

  return (
    <AutoSizeInput
      id={key}
      placeholder="Enter value"
      minWidth={15}
      maxWidth={30}
      value={value}
      loading={loading}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}
