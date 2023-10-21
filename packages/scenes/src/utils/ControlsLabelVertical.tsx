import React from 'react';
import { Icon, IconButton, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
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
  onRemove?: () => void;
}

export function ControlsLabelVertical(props: ControlsLabelProps) {
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
      {props.label}
      {errorIndicator}
      {props.icon && <Icon name={props.icon} className={styles.normalIcon} />}
      {loadingIndicator}
      {props.onRemove && (
        <IconButton variant="secondary" size="xs" name="times" onClick={props.onRemove} tooltip={'Remove filter'} />
      )}
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
    display: `flex`,
    alignItems: 'center',
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    whiteSpace: 'nowrap',
    marginBottom: theme.spacing(0.5),
    gap: theme.spacing(1),
  }),
  errorIcon: css({
    color: theme.colors.error.text,
  }),
  normalIcon: css({
    color: theme.colors.text.secondary,
  }),
});
