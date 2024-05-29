import React, { useEffect, useState } from 'react';
import { CustomVariable as CustomVariableObject, VariableValue } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';

export interface CustomVariableProps {
  query: string;
  name: string;
  label?: string;
  initialValue?: VariableValue;
  isMulti?: boolean;
  children: React.ReactNode;
}

export function CustomVariable({
  query,
  name,
  label,
  initialValue,
  children,
  isMulti,
}: CustomVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: CustomVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new CustomVariableObject({ name, label, query, value: initialValue, isMulti });
  }

  useEffect(() => {
    scene.addVariable(variable);
    setVariableAdded(true);

    return () => {
      scene.removeVariable(variable);
    };
  }, [variable, scene, name]);

  // TOOD: handle prop updates

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
