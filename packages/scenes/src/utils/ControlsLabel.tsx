import React from 'react';
import { Icon, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { css } from '@emotion/css';
import { LoadingIndicator } from './LoadingIndicator';

interface ControlsLabelProps {
  label: string;
  htmlFor?: string;
  description?: string;
  isLoading?: boolean;
  error?: string;
  icon?: IconName;
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

  let errorIndicator = null;
  if (props.error) {
    errorIndicator = (
      <Tooltip content={props.error} placement={'bottom'}>
        <Icon className={styles.errorIcon} name="exclamation-triangle" />
      </Tooltip>
    );
  }

  const label = (
    <label
      className={styles.label}
      data-testid={
        typeof props.label === 'string' ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : ''
      }
      htmlFor={props.htmlFor}
    >
      {errorIndicator}
      {props.icon && <Icon name={props.icon} className={styles.normalIcon} />}
      {props.label}
      {loadingIndicator}
    </label>
  );

  if (props.description) {
    return (
      <Tooltip content={props.description} placement={'bottom'}>
        {label}
      </Tooltip>
    );
  }

  return label;
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
    gap: theme.spacing(0.5),
  }),
  errorIcon: css({
    color: theme.colors.error.text,
  }),
  normalIcon: css({
    color: theme.colors.text.secondary,
  }),
});
