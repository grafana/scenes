import { Trans } from '@grafana/i18n';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, useStyles2 } from '@grafana/ui';
import React, { forwardRef, useId } from 'react';

interface DropdownItemProps {
  children: React.ReactNode;
  active?: boolean;
  addGroupBottomBorder?: boolean;
  isMultiValueEdit?: boolean;
  checked?: boolean;
  nonInteractive?: boolean;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps & React.HTMLProps<HTMLDivElement>>(
  function DropdownItem(
    { children, active, addGroupBottomBorder, isMultiValueEdit, checked, nonInteractive, ...rest },
    ref
  ) {
    const styles = useStyles2(getStyles);
    const id = useId();

    const ariaProps = nonInteractive ? {} : { role: 'option', 'aria-selected': active };

    return (
      <div
        ref={ref}
        id={id}
        {...ariaProps}
        className={cx(
          styles.option,
          active && styles.optionFocused,
          addGroupBottomBorder && styles.groupBottomBorder,
          nonInteractive && styles.optionNonInteractive
        )}
        {...rest}
      >
        <div className={styles.optionBody} data-testid={`data-testid ad hoc filter option value ${children}`}>
          <span>
            {isMultiValueEdit ? <Checkbox tabIndex={-1} checked={checked} className={styles.checkbox} /> : null}
            {children}
          </span>
        </div>
      </div>
    );
  }
);

const getStyles = (theme: GrafanaTheme2) => ({
  option: css({
    label: 'grafana-select-option',
    top: 0,
    left: 0,
    width: '100%',
    position: 'absolute',
    padding: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      background: theme.colors.action.hover,
      '@media (forced-colors: active), (prefers-contrast: more)': {
        border: `1px solid ${theme.colors.primary.border}`,
      },
    },
  }),
  optionFocused: css({
    label: 'grafana-select-option-focused',
    background: theme.colors.action.focus,
    '@media (forced-colors: active), (prefers-contrast: more)': {
      border: `1px solid ${theme.colors.primary.border}`,
    },
  }),
  optionNonInteractive: css({
    label: 'grafana-select-option-non-interactive',
    cursor: 'default',
    '&:hover': {
      background: 'transparent',
      '@media (forced-colors: active), (prefers-contrast: more)': {
        border: 'none',
      },
    },
  }),
  optionBody: css({
    label: 'grafana-select-option-body',
    display: 'flex',
    fontWeight: theme.typography.fontWeightMedium,
    flexDirection: 'column',
    flexGrow: 1,
  }),
  groupBottomBorder: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  checkbox: css({
    paddingRight: theme.spacing(0.5),
  }),
  multiValueApplyWrapper: css({
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
    overflowY: 'auto',
    zIndex: theme.zIndex.dropdown,
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1.5)} ${theme.spacing(1)}`,
  }),
});

export const LoadingOptionsPlaceholder = () => {
  return (
    <DropdownItem nonInteractive onClick={(e) => e.stopPropagation()}>
      <Trans i18nKey="grafana-scenes.variables.loading-options-placeholder.loading-options">Loading options...</Trans>
    </DropdownItem>
  );
};

export const NoOptionsPlaceholder = () => {
  return (
    <DropdownItem nonInteractive onClick={(e) => e.stopPropagation()}>
      <Trans i18nKey="grafana-scenes.variables.no-options-placeholder.no-options-found">No options found</Trans>
    </DropdownItem>
  );
};

export const ExpressionHintPlaceholder = () => {
  return (
    <DropdownItem nonInteractive onClick={(e) => e.stopPropagation()}>
      <Trans i18nKey="grafana-scenes.variables.expression-hint-placeholder.press-enter-to-apply">
        Press Enter to apply
      </Trans>
    </DropdownItem>
  );
};

export const OptionsErrorPlaceholder = ({ handleFetchOptions }: { handleFetchOptions: () => void }) => {
  return (
    <DropdownItem onClick={handleFetchOptions}>
      <Trans i18nKey="grafana-scenes.variables.options-error-placeholder.error-occurred-fetching-labels-click-retry">
        An error has occurred fetching labels. Click to retry
      </Trans>
    </DropdownItem>
  );
};

interface MultiValueApplyButtonProps {
  onApply: () => void;
  floatingElement: HTMLElement | null;
  maxOptionWidth: number;
  menuHeight: number;
}

export const MultiValueApplyButton = ({
  onApply,
  floatingElement,
  maxOptionWidth,
  menuHeight,
}: MultiValueApplyButtonProps) => {
  const styles = useStyles2(getStyles);

  const floatingElementRect = floatingElement?.getBoundingClientRect();
  return (
    <div
      className={styles.multiValueApplyWrapper}
      style={{
        width: `${maxOptionWidth}px`,
        transform: `translate(${floatingElementRect?.left}px,${
          floatingElementRect ? floatingElementRect.top + menuHeight : 0
        }px)`,
      }}
    >
      <Button onClick={onApply} size="sm" tabIndex={-1}>
        <Trans i18nKey="grafana-scenes.variables.multi-value-apply-button.apply">Apply</Trans>
      </Button>
    </div>
  );
};
