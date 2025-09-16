import React, { createContext, useContext } from 'react';
import { ContextValueBase } from '../contexts/ContextValueBase';
import { CustomVariableValue } from '@grafana/scenes';

export type VariableValue = VariableValueSingle | VariableValueSingle[];

export type VariableValueSingle = string | boolean | number;

export interface VariableBaseState {
  skipUrlSync: boolean;
  name: string;
  loading: boolean;
  value?: VariableValue;
  label?: string;
  format: (fieldPath?: string) => string | CustomVariableValue;
  setValue?: (value: VariableValue, label?: string) => void;
}

export interface VariableValueOption {
  label: string;
  value: VariableValueSingle;
}

export interface VariableContextState {
  parent?: VariableContextState;
  state: VariableBaseState[];
}

export class VariableContextValue extends ContextValueBase<VariableContextState> {
  public constructor(obj: {}) {
    super({
      variables: [],
    });
  }
}

export const VariableContext = createContext<VariableContextValue>(new VariableContextValue({}));

function Test() {
  return (
    <div>
      <TestVariable name="env" value="test">
        <div></div>
      </TestVariable>
    </div>
  );
}

export interface TestVariableProps {
  name: string;
  value: string;
  children: React.ReactNode;
}

export function TestVariable(props: TestVariableProps) {
  const ctx = useContext(VariableContext);
  ctx.defineVariable(props.name);

  return <div></div>;
}
