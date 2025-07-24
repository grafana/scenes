import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { ReactNode } from 'react';
import { SceneObject } from '../../core/types';

export interface Props {
  node: SceneObject;
  selectedObject?: SceneObject;
  onSelect: (node: SceneObject) => void;
}

export function DebugTreeNode({ node, selectedObject, onSelect }: Props) {
  const styles = useStyles2(getStyles);
  const children: ReactNode[] = [];
  const isSelected = node === selectedObject;

  node.forEachChild((child) => {
    children.push(
      <DebugTreeNode node={child} key={child.state.key} selectedObject={selectedObject} onSelect={onSelect} />
    );
  });

  return (
    <div className={styles.container}>
      <div className={cx(styles.name, isSelected && styles.selected)} onClick={() => onSelect(node)}>
        {node.constructor.name}
      </div>
      <div className={styles.children}>{children}</div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      flexGrow: 1,
      display: 'flex',
      gap: theme.spacing(0.5),
      flexDirection: 'column',
    }),
    name: css({
      flexGrow: 1,
      display: 'flex',
      gap: theme.spacing(1),
      fontSize: theme.typography.bodySmall.fontSize,
      cursor: 'pointer',
      padding: theme.spacing(0, 1),
      borderRadius: theme.shape.borderRadius(2),
      position: 'relative',
      '&:hover': {
        background: theme.colors.background.secondary,
      },
    }),
    selected: css({
      '&::before': {
        display: 'block',
        content: "' '",
        position: 'absolute',
        left: 0,
        width: 4,
        bottom: 2,
        top: 2,
        borderRadius: theme.shape.radius.default,
        backgroundImage: theme.colors.gradients.brandVertical,
      },
    }),
    children: css({
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: theme.spacing(1),
    }),
  };
}
