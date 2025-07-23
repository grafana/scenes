import * as React from 'react';

import { getSelectStyles, useTheme2 } from '@grafana/ui';

export interface GroupByContainerProps {
  innerProps: JSX.IntrinsicElements['div'];
  filtersApplicability?: Array<{ key: string; isApplicable: boolean }>;
}

export const GroupByValueContainer = ({
  filtersApplicability,
  children,
}: React.PropsWithChildren<GroupByContainerProps>) => {
  const theme = useTheme2();
  const styles = getSelectStyles(theme);
  console.log(children, filtersApplicability);

  return (
    <div className={styles.multiValueContainer}>
      {React.Children.map(children, (child) => {
        // Check if child is a valid React element with props
        if (!React.isValidElement(child) || !child.props?.data?.value) {
          return child;
        }

        const filterApplicability = filtersApplicability?.find((filter) => filter.key === child.props.data.value);

        if (!filterApplicability) {
          return child;
        }

        if (!filterApplicability.isApplicable) {
          return <s key={filterApplicability.key}>{child}</s>;
        }

        return child;
      })}
    </div>
  );
};
