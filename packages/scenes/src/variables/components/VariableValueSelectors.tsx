import React from 'react';

import { VariableHide } from '@grafana/data';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { ControlsLayout, SceneComponentProps, SceneObjectState } from '../../core/types';
import { SceneVariable } from '../types';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';

export interface VariableValueSelectorsState extends SceneObjectState {
  layout?: ControlsLayout;
}

export class VariableValueSelectors extends SceneObjectBase<VariableValueSelectorsState> {
  public static Component = VariableValueSelectorsRenderer;
}

function VariableValueSelectorsRenderer({ model }: SceneComponentProps<VariableValueSelectors>) {
  const variables = sceneGraph.getVariables(model)!.useState();

  return (
    <>
      {variables.variables.map((variable) => (
        <VariableValueSelectWrapper key={variable.state.key} variable={variable} layout={model.state.layout} />
      ))}
    </>
  );
}

interface VariableSelectProps {
  layout?: ControlsLayout;
  variable: SceneVariable;
}

function VariableValueSelectWrapper({ variable, layout }: VariableSelectProps) {
  const state = variable.useState();

  if (state.hide === VariableHide.hideVariable) {
    return null;
  }

  if (layout === 'vertical') {
    return (
      <div className={verticalContainer}>
        <VariableLabel variable={variable} layout={layout} />
        <variable.Component model={variable} />
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <VariableLabel variable={variable} />
      <variable.Component model={variable} />
    </div>
  );
}

function VariableLabel({ variable, layout }: VariableSelectProps) {
  const { state } = variable;

  if (variable.state.hide === VariableHide.hideLabel) {
    return null;
  }

  const elementId = `var-${state.key}`;
  const labelOrName = state.label ?? state.name;

  return (
    <ControlsLabel
      htmlFor={elementId}
      isLoading={state.loading}
      onCancel={() => variable.onCancel?.()}
      label={labelOrName}
      error={state.error}
      layout={layout}
      description={state.description ?? undefined}
    />
  );
}

const containerStyle = css({ display: 'flex' });
const verticalContainer = css({ display: 'flex', flexDirection: 'column' });
