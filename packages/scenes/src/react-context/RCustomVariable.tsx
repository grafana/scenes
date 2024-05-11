import React, { useEffect, useId, useState } from 'react';
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
  const key = useId();
  const [variable, setVariable] = useState<CustomVariable>(scene.findVariable(name));

  useEffect(() => {
    if (variable) {
      return;
    }

    const newVariable = new CustomVariable({ key, name, query, value: initialValue });
    scene.addVariable(newVariable);

    setVariable(newVariable);

    console.log('RCustomVariable: Adding variable', key);

    return () => {
      console.log('RCustomVariable: Removing variable', key);
      scene.removeVariable(variable);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable

  if (!variable) {
    return null;
  }

  return children;
}
