import { VariableHide } from '@grafana/data';

import { SceneObjectBase, useSceneObjectState } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { ControlsLayout, SceneComponentProps, SceneObjectState } from '../../core/types';
import { SceneVariable, SceneVariableState } from '../types';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';
import { selectors } from '@grafana/e2e-selectors';

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
  /** To override hide from VariableValueSelectByName  */
  showAlways?: boolean;
  /** To provide an option to hide the label in the variable value selector */
  hideLabel?: boolean;
}

export function VariableValueSelectWrapper({ variable, layout, showAlways, hideLabel }: VariableSelectProps) {
  const state = useSceneObjectState<SceneVariableState>(variable, { shouldActivateOrKeepAlive: true });

  if (state.hide === VariableHide.hideVariable && !showAlways) {
    if (variable.UNSAFE_renderAsHidden) {
      return <variable.Component model={variable} />;
    }

    return null;
  }

  if (layout === 'vertical') {
    return (
      <div className={verticalContainer} data-testid={selectors.pages.Dashboard.SubMenu.submenuItem}>
        <VariableLabel variable={variable} layout={layout} hideLabel={hideLabel} />
        <variable.Component model={variable} />
      </div>
    );
  }

  return (
    <div className={containerStyle} data-testid={selectors.pages.Dashboard.SubMenu.submenuItem}>
      <VariableLabel variable={variable} hideLabel={hideLabel} />
      <variable.Component model={variable} />
    </div>
  );
}

function VariableLabel({ variable, layout, hideLabel }: VariableSelectProps) {
  const { state } = variable;

  if (variable.state.hide === VariableHide.hideLabel || hideLabel) {
    return null;
  }

  const elementId = `var-${state.key}`;
  const labelOrName = state.label || state.name;

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

const containerStyle = css({
  display: 'flex',
  // No border for second element (inputs) as label and input border is shared
  '> :nth-child(2)': css({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  }),
});

const verticalContainer = css({ display: 'flex', flexDirection: 'column' });
