import React from 'react';
import { Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { LoadingIndicator } from './LoadingIndicator';

interface ControlsLabelProps {
  label: string;
  htmlFor: string;
  description?: string;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ControlsLabel(props: ControlsLabelProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const loadingIndicator = Boolean(props.isLoading) ? (
    <div style={{ marginLeft: theme.spacing(1), marginTop: '-1px' }}>
      <LoadingIndicator
        onCancel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onCancel?.();
        }}
      />
    </div>
  ) : null;

  if (props.description) {
    return (
      <label
        className={styles.label}
        data-testid={
          typeof props.label === 'string' ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : ''
        }
        htmlFor={props.htmlFor}
      >
        <Tooltip content={props.description} placement={'bottom'}>
          <span>{props.label}</span>
        </Tooltip>
        {loadingIndicator}
      </label>
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
      {loadingIndicator}
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
