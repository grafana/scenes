import React, { useEffect, useState } from 'react';
import { CustomVariable as CustomVariableObject } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';

export interface CustomVariableProps extends VariableProps {
  query: string;
  isMulti?: boolean;
  includeAll?: boolean;
  children: React.ReactNode;
}

export function CustomVariable({
  query,
  name,
  label,
  hide,
  initialValue,
  isMulti,
  includeAll,
  skipUrlSync,
  allValue,
  children,
}: CustomVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: CustomVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new CustomVariableObject({
      name,
      label,
      query,
      value: initialValue,
      isMulti,
      includeAll,
      hide,
      skipUrlSync,
      allValue,
    });
  }

  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);

  useEffect(() => {
    variable?.setState({
      label,
      query,
      hide,
      isMulti,
      includeAll,
      skipUrlSync,
      allValue,
    });
  }, [skipUrlSync, allValue, hide, includeAll, isMulti, label, query, variable]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
