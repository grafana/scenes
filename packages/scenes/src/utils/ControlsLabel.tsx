import React from 'react';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface ControlsLabelProps {
  label: string | React.ReactNode;
  htmlFor: string;
  description?: string;
}

export function ControlsLabel(props: ControlsLabelProps) {
  const styles = useStyles2(getStyles);

  if (props.description) {
    return (
      <Tooltip content={props.description} placement={'bottom'}>
        <label
          className={styles.label}
          data-testid={
            typeof props.label === 'string' ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : ''
          }
          htmlFor={props.htmlFor}
        >
          {props.label}
        </label>
      </Tooltip>
    );
  }

  return (
    <label
      className={styles.label}
      data-testid={
        typeof props.label === 'string' ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : ''
      }
      htmlFor={props.htmlFor}
    >
      {props.label}
    </label>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  label: css({
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
