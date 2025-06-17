import { t } from '@grafana/i18n';
import React from 'react';
import { Icon, IconButton, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { LoadingIndicator } from './LoadingIndicator';
import { ControlsLayout } from '../core/types';

interface ControlsLabelProps {
  label: string;
  htmlFor?: string;
  description?: string;
  isLoading?: boolean;
  error?: string;
  icon?: IconName;
  layout?: ControlsLayout;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  onCancel?: () => void;
  onRemove?: () => void;
}

export function ControlsLabel(props: ControlsLabelProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const isVertical = props.layout === 'vertical';

  const loadingIndicator = Boolean(props.isLoading) ? (
    <div
      style={{ marginLeft: theme.spacing(1), marginTop: '-1px' }}
      aria-label={selectors.components.LoadingIndicator.icon}
    >
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

  let descriptionIndicator = null;
  if (props.description) {
    descriptionIndicator = (
      <Tooltip content={props.description} placement={isVertical ? 'top' : 'bottom'}>
        <Icon className={styles.normalIcon} name="info-circle" />
      </Tooltip>
    );
  }

  const testId =
    typeof props.label === 'string' ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : '';
  let labelElement: JSX.Element;

  // The vertical layout has different css class and order of elements (label always first)

  if (isVertical) {
    labelElement = (
      <label className={cx(styles.verticalLabel, props.className)} data-testid={testId} htmlFor={props.htmlFor}>
        {props.prefix}
        {props.label}
        {descriptionIndicator}
        {errorIndicator}
        {props.icon && <Icon name={props.icon} className={styles.normalIcon} />}
        {loadingIndicator}
        {props.onRemove && (
          <IconButton
            variant="secondary"
            size="xs"
            name="times"
            onClick={props.onRemove}
            tooltip={t('grafana-scenes.utils.controls-label.tooltip-remove', 'Remove')}
          />
        )}
        {props.suffix}
      </label>
    );
  } else {
    labelElement = (
      <label className={cx(styles.horizontalLabel, props.className)} data-testid={testId} htmlFor={props.htmlFor}>
        {props.prefix}
        {errorIndicator}
        {props.icon && <Icon name={props.icon} className={styles.normalIcon} />}
        {props.label}
        {descriptionIndicator}
        {loadingIndicator}
        {props.suffix}
      </label>
    );
  }

  return labelElement;
}

const getStyles = (theme: GrafanaTheme2) => ({
  horizontalLabel: css({
    background: theme.isDark ? theme.colors.background.primary : theme.colors.background.secondary,
    display: `flex`,
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    height: theme.spacing(theme.components.height.md),
    lineHeight: theme.spacing(theme.components.height.md),
    borderRadius: `${theme.shape.radius.default} 0 0 ${theme.shape.radius.default}`,
    border: `1px solid ${theme.components.input.borderColor}`,
    position: 'relative',
    // To make the border line up with the input border
    right: -1,
    whiteSpace: 'nowrap',
    gap: theme.spacing(0.5),
  }),
  verticalLabel: css({
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
