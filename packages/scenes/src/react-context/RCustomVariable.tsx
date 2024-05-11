import React, { useEffect, useId } from 'react';
import { useSceneContext } from './SceneContextProvider';
import { sceneGraph } from '../core/sceneGraph';
import { CustomVariable } from '../variables/variants/CustomVariable';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';

export interface RCustomVariableProps {
  query: string;
  name: string;
  initialValue?: string;
}

/**
 * Could not get this to work fully without child variable select rendering before this useEffect here
 * So on first render the RVariableSelect shows "variable not found".
 * Could be solved with the full page (everything that might need this variable) under this component (only after variable is added to scene graph)
 **/
export function RCustomVariable({ query, name, initialValue }: RCustomVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const key = useId();

  const customVariable = sceneGraph.lookupVariable(name, scene);

  useEffect(() => {
    if (customVariable) {
      return;
    }

    const newVariable = new CustomVariable({ key, name, query, value: initialValue });
    const set = scene.state.$variables as SceneVariableSet;
    set.setState({ variables: [...set.state.variables, newVariable] });
    console.log('adding variable', key);

    return () => {
      console.log('removing variable', key);
      set.setState({ variables: set.state.variables.filter((x) => x !== newVariable) });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
