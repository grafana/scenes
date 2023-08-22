import React from 'react';

import { GrafanaTheme2, VariableHide } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Tooltip, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectState } from '../../core/types';
import { SceneVariableState } from '../types';
import { css } from '@emotion/css';

export class VariableValueSelectors extends SceneObjectBase<SceneObjectState> {
  public static Component = VariableValueSelectorsRenderer;
}

function VariableValueSelectorsRenderer({ model }: SceneComponentProps<VariableValueSelectors>) {
  const variables = sceneGraph.getVariables(model)!.useState();
  const styles = useStyles2(getStyles);

  return (
    <>
      {variables.variables.map((variable) => (
        <VariableValueSelectWrapper key={variable.state.key} variable={variable} styles={styles} />
      ))}
    </>
  );
}

function VariableValueSelectWrapper({
  variable,
  styles,
}: {
  variable: SceneObject<SceneVariableState>;
  styles: VariableLabelStyles;
}) {
  const state = variable.useState();

  if (state.hide === VariableHide.hideVariable) {
    return null;
  }

  return (
    <div className={styles.container}>
      <VariableLabel state={state} styles={styles} />
      <variable.Component model={variable} />
    </div>
  );
}

function VariableLabel({ state, styles }: { state: SceneVariableState; styles: VariableLabelStyles }) {
  if (state.hide === VariableHide.hideLabel) {
    return null;
  }

  const elementId = `var-${state.key}`;
  const labelOrName = state.label ?? state.name;

  if (state.description) {
    return (
      <Tooltip content={state.description} placement={'bottom'}>
        <label
          className={styles.variableLabel}
          data-testid={selectors.pages.Dashboard.SubMenu.submenuItemLabels(labelOrName)}
          htmlFor={elementId}
        >
          {labelOrName}
        </label>
      </Tooltip>
    );
  }

  return (
    <label
      className={styles.variableLabel}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemLabels(labelOrName)}
      htmlFor={elementId}
    >
      {labelOrName}
    </label>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
  }),
  variableLabel: css({
    background: theme.isDark ? theme.colors.background.primary : theme.colors.background.secondary,
    display: `flex`,
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    height: theme.spacing(theme.components.height.md),
    lineHeight: theme.spacing(theme.components.height.md),
    borderRadius: theme.shape.borderRadius(1),
    border: `1px solid ${theme.components.input.borderColor}`,
    position: 'relative',
    // To make the border line up with the input border
    right: -1,
    whiteSpace: 'nowrap',
  }),
});

type VariableLabelStyles = ReturnType<typeof getStyles>;
