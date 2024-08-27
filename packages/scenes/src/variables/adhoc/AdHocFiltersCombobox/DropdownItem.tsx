import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { forwardRef, useId } from 'react';

interface DropdownItemProps {
  children: React.ReactNode;
  active?: boolean;
  addGroupBottomBorder?: boolean;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps & React.HTMLProps<HTMLDivElement>>(
  function DropdownItem({ children, active, addGroupBottomBorder, ...rest }, ref) {
    const styles = useStyles2(getStyles);
    const id = useId();
    return (
      <div
        ref={ref}
        role="option"
        id={id}
        aria-selected={active}
        className={cx(styles.option, active && styles.optionFocused, addGroupBottomBorder && styles.groupBottomBorder)}
        {...rest}
      >
        <div className={styles.optionBody} data-testid={`data-testid ad hoc filter option value ${children}`}>
          <span>{children}</span>
        </div>
      </div>
    );
  }
);

const getStyles = (theme: GrafanaTheme2) => ({
  option: css({
    label: 'grafana-select-option',
    padding: '8px',
    position: 'relative',
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
});
