import React from 'react';

import {  Input } from '@grafana/ui';

import { SceneComponentProps } from '../../core/types';
import { TextBoxVariable } from '../variants/TextBoxVariable';

export function VariableValueInput({ model }: SceneComponentProps<TextBoxVariable>) {
    const { value, key, loading } = model.useState();
  
    return (
      <Input
        id={key}
        placeholder="Enter variable value"
        value={value}
        loading={loading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          model.setValue(e.target.value);
        }}
      />
    );
  }
