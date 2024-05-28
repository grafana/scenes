import React, { useEffect, useState } from 'react';
import { CustomVariable, VariableValue } from '@grafana/scenes';
import { useSceneContext } from './hooks';

export interface RCustomVariableProps {
  query: string;
  name: string;
  label?: string;
  initialValue?: VariableValue;
  isMulti?: boolean;
  children: React.ReactNode;
}

export function RCustomVariable({
  query,
  name,
  label,
  initialValue,
  children,
  isMulti,
}: RCustomVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: CustomVariable | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new CustomVariable({ name, label, query, value: initialValue, isMulti });
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
