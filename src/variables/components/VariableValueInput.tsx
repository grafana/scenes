import React, { useState, useCallback } from 'react';

import { Input } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { TextBoxVariable } from '../variants/TextBoxVariable';
import { useDebounce } from 'react-use';

export function VariableValueInput({ model }: SceneComponentProps<TextBoxVariable>) {
  const { value, key, loading } = model.useState();
  const [textValue, setTextValue] = useState(value);
  useDebounce(
    () => {
      model.setValue(textValue);
    },
    250,
    [textValue]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTextValue(e.target.value);
    },
    [setTextValue]
  );

  return <Input id={key} placeholder="Enter variable value" value={textValue} loading={loading} onChange={onChange} />;
}
