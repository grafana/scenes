import React, { useEffect, useState } from 'react';
import { useSceneContext } from './SceneContextProvider';
import { CustomVariable } from '../variables/variants/CustomVariable';

export interface RCustomVariableProps {
  query: string;
  name: string;
  initialValue?: string;
  children: React.ReactNode;
}

export function RCustomVariable({ query, name, initialValue, children }: RCustomVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: CustomVariable = scene.findVariable(name);

  if (!variable) {
    variable = new CustomVariable({ name, query, value: initialValue });
  }

  useEffect(() => {
    scene.addVariable(variable);
    setVariableAdded(true);

    return () => {
      scene.removeVariable(variable);
    };
  }, [variable, scene, name]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
