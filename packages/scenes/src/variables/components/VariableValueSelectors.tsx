import React from 'react';

import { VariableHide } from '@grafana/data';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { SceneVariable } from '../types';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';

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

function VariableValueSelectWrapper({ variable }: { variable: SceneVariable }) {
  const state = variable.useState();

  if (state.hide === VariableHide.hideVariable) {
    return null;
  }

  return (
    <div className={containerStyle}>
      <VariableLabel model={variable} />
      <variable.Component model={variable} />
    </div>
  );
}

function VariableLabel({ model }: { model: SceneVariable }) {
  if (model.state.hide === VariableHide.hideLabel) {
    return null;
  }

  const elementId = `var-${model.state.key}`;
  const labelOrName = model.state.label ?? model.state.name;

  return (
    <ControlsLabel
      htmlFor={elementId}
      isLoading={model.state.loading}
      onCancel={() => model.onCancel?.()}
      label={labelOrName}
      error={model.state.error}
      description={model.state.description ?? undefined}
    />
  );
}

const containerStyle = css({ display: 'flex' });
