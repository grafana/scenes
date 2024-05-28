import React from 'react';
import { sceneGraph, VariableValueSelectWrapper } from '@grafana/scenes';
import { useSceneContext } from './hooks';

export interface Props {
  name: string;
}

export function RVariableSelect({ name }: Props) {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);

  if (!variable) {
    return <div>Variable {name} not found</div>;
  }

  return <VariableValueSelectWrapper key={variable.state.key} variable={variable} />;
}
