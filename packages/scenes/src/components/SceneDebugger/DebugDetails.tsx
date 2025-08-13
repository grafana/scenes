import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Input, JSONFormatter, useStyles2 } from '@grafana/ui';
import { isArray, isPlainObject } from 'lodash';
import { isSceneObject, SceneObject } from '../../core/types';

export interface Props {
  node: SceneObject;
}

export function DebugDetails({ node }: Props) {
  const state = node.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      {Object.keys(state).map((key) => (
        <div className={styles.row} key={key}>
          <div className={styles.keyName}>{key}</div>
          <div className={styles.value}>{renderValue(key, (state as any)[key], node)}</div>
        </div>
      ))}
    </div>
  );
}

function renderValue(key: string, value: any, node: SceneObject) {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'number':
      return (
        <Input
          type="number"
          defaultValue={value}
          onBlur={(evt) => node.setState({ [key]: evt.currentTarget.valueAsNumber })}
        />
      );
    case 'string':
      return (
        <Input type="text" defaultValue={value} onBlur={(evt) => node.setState({ [key]: evt.currentTarget.value })} />
      );
    case 'object':
      if (isSceneObject(value)) {
        return value.constructor.name;
      }
      if (isPlainObject(value) || isArray(value)) {
        return <JSONFormatter json={value} open={0} />;
      }
      return String(value);
    default:
      return typeof value;
  }
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      flexGrow: 1,
      display: 'flex',
      gap: theme.spacing(0.5),
      flexDirection: 'column',
    }),
    row: css({
      display: 'flex',
      gap: theme.spacing(2),
    }),
    keyName: css({
      display: 'flex',
      flexGrow: '0',
      width: 120,
      alignItems: 'center',
      height: theme.spacing(theme.components.height.md),
    }),
    value: css({
      flexGrow: 1,
      minHeight: theme.spacing(theme.components.height.md),
      display: 'flex',
      alignItems: 'center',
    }),
  };
}
