// import React from 'react';
// import { ControlsLayout, sceneGraph, VariableValueSelectWrapper } from '@grafana/scenes';
// import { useSceneContext } from '../hooks/hooks';

// export interface Props {
//   name: string;
//   hideLabel?: boolean;
//   layout?: ControlsLayout;
// }

// export function VariableControl({ name, hideLabel, layout }: Props) {
//   const scene = useSceneContext();
//   const variable = sceneGraph.lookupVariable(name, scene);

//   if (!variable) {
//     return <div>Variable {name} not found</div>;
//   }

//   return (
//     <VariableValueSelectWrapper key={variable.state.key} variable={variable} hideLabel={hideLabel} layout={layout} />
//   );
// }
