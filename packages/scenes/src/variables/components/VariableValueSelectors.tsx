import React from 'react';

import { VariableHide } from '@grafana/data';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectState } from '../../core/types';
import { SceneVariableState } from '../types';
import { ControlsLabel } from '../../utils/ControlsLabel';

export class VariableValueSelectors extends SceneObjectBase<SceneObjectState> {
  public static Component = VariableValueSelectorsRenderer;
}

function VariableValueSelectorsRenderer({ model }: SceneComponentProps<VariableValueSelectors>) {
  const variables = sceneGraph.getVariables(model)!.useState();

  return (
    <>
      {variables.variables.map((variable) => (
        <VariableValueSelectWrapper key={variable.state.key} variable={variable} />
      ))}
    </>
  );
}

function VariableValueSelectWrapper({ variable }: { variable: SceneObject<SceneVariableState> }) {
  const state = variable.useState();

  if (state.hide === VariableHide.hideVariable) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <VariableLabel state={state} />
      <variable.Component model={variable} />
    </div>
  );
}

function VariableLabel({ state }: { state: SceneVariableState }) {
  if (state.hide === VariableHide.hideLabel) {
    return null;
  }

  const elementId = `var-${state.key}`;
  const labelOrName = state.label ?? state.name;

  return <ControlsLabel htmlFor={elementId} label={labelOrName} description={state.description ?? undefined} />;
}
