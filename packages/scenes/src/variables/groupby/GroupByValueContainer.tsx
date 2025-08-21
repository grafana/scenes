import React from 'react';

import { getSelectStyles, useTheme2 } from '@grafana/ui';
// @ts-expect-error (temporary till we update grafana/data)
import { FiltersApplicability } from '@grafana/data';

export interface GroupByContainerProps {
  innerProps: JSX.IntrinsicElements['div'];
  keysApplicability?: FiltersApplicability[];
}

const isValidReactElementWithData = (child: React.ReactNode): child is React.ReactElement => {
  return React.isValidElement(child) && Boolean(child.props?.data?.value);
};

const findKeyApplicability = (
  keysApplicability: FiltersApplicability[] | undefined,
  value: string
): FiltersApplicability | undefined => {
  return keysApplicability?.find((applicability) => applicability.key === value);
};

const renderChildWithApplicability = (
  child: React.ReactElement,
  applicability: FiltersApplicability | undefined
): React.ReactNode => {
  if (!applicability) {
    return child;
  }

  if (!applicability.applicable) {
    return <s key={applicability.key}>{child}</s>;
  }

  return child;
};

export const GroupByValueContainer = ({
  keysApplicability,
  children,
}: React.PropsWithChildren<GroupByContainerProps>) => {
  const theme = useTheme2();
  const styles = getSelectStyles(theme);

  const renderChild = (child: React.ReactNode): React.ReactNode => {
    if (!isValidReactElementWithData(child)) {
      return child;
    }

    const value = child.props.data.value;
    const applicability = findKeyApplicability(keysApplicability, value);

    return renderChildWithApplicability(child, applicability);
  };

  return <div className={styles.multiValueContainer}>{React.Children.map(children, renderChild)}</div>;
};
