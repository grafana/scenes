import React from 'react';
import { getSelectStyles, useTheme2 } from '@grafana/ui';
// @ts-expect-error (temporary till we update grafana/data)
import { DrilldownsApplicability, GrafanaTheme2 } from '@grafana/data';
import { cx } from '@emotion/css';
import { getNonApplicablePillStyles } from '../utils';

export interface GroupByContainerProps {
  innerProps: JSX.IntrinsicElements['div'];
  keysApplicability?: DrilldownsApplicability[];
}

export const GroupByValueContainer = ({
  keysApplicability,
  children,
}: React.PropsWithChildren<GroupByContainerProps>) => {
  const theme = useTheme2();
  const styles = getSelectStyles(theme);
  const { disabledPill, strikethrough } = getNonApplicablePillStyles(theme);

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

  return (
    <div className={cx(styles.multiValueContainer, !isApplicable && cx(disabledPill, strikethrough))}>{children}</div>
  );
};
