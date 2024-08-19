import { cx } from '@emotion/css';
import { useTheme2, getSelectStyles } from '@grafana/ui';
import React, { forwardRef, useId } from 'react';

interface DropdownItemProps {
  children: React.ReactNode;
  active: boolean;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps & React.HTMLProps<HTMLDivElement>>(
  function DropdownItem({ children, active, ...rest }, ref) {
    const theme = useTheme2();
    const selectStyles = getSelectStyles(theme);
    const id = useId();
    return (
      <div
        ref={ref}
        role="option"
        id={id}
        aria-selected={active}
        className={cx(selectStyles.option, active && selectStyles.optionFocused)}
        {...rest}
      >
        <div className={selectStyles.optionBody} data-testid={`data-testid ad hoc filter option value ${children}`}>
          <span>{children}</span>
        </div>
      </div>
    );
  }
);
