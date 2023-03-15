import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

export interface Props {
  label?: string;
  separator?: boolean;
  children: React.ReactNode;
}

export function ItemWithLabel(props: Props) {
  const styles = useStyles2(getStyles);

  if (!props.label) {
    return <>{props.children}</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.infoItem}>
        <div className={styles.label}>{props.label}</div>
        <div className={styles.children}> {props.children}</div>
      </div>
      {props.separator && <div data-testid="page-info-separator" className={styles.separator} />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1.5),
    }),
    infoItem: css({
      ...theme.typography.bodySmall,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    label: css({
      color: theme.colors.text.secondary,
    }),
    children: css({
      display: 'flex',
      alignItems: 'center',
      flexGrow: 1,
    }),
    separator: css({
      borderLeft: `1px solid ${theme.colors.border.weak}`,
      margin: theme.spacing(0, 1),
    }),
  };
};
