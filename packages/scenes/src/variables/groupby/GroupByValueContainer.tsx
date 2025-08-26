import React from 'react';
import { getSelectStyles, useTheme2 } from '@grafana/ui';
// @ts-expect-error (temporary till we update grafana/data)
import { FiltersApplicability, GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';

export interface GroupByContainerProps {
  innerProps: JSX.IntrinsicElements['div'];
  keysApplicability?: FiltersApplicability[];
}

export const GroupByValueContainer = ({
  keysApplicability,
  children,
}: React.PropsWithChildren<GroupByContainerProps>) => {
  const theme = useTheme2();
  const styles = getSelectStyles(theme);
  const { nonApplicablePill } = getStyles(theme);

  // Get the value from the first child (the label div)
  const firstChild = React.Children.toArray(children)[0];
  let isApplicable = true;

  if (React.isValidElement(firstChild) && firstChild.props?.data?.value) {
    const value = firstChild.props.data.value;
    const applicability = keysApplicability?.find((item) => item.key === value);

    if (applicability && !applicability.applicable) {
      isApplicable = false;
    }
  }

  return <div className={cx(styles.multiValueContainer, !isApplicable && nonApplicablePill)}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  nonApplicablePill: css({
    background: theme.colors.action.selected,
    color: theme.colors.text.disabled,
    border: 0,
    '&:hover': {
      background: theme.colors.action.selected,
    },
    textDecoration: 'line-through',
  }),
});
