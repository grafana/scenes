import { css } from '@emotion/css';
import React, { CSSProperties, useCallback } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, ToolbarButton, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneComponentProps, SceneLayout, SceneObjectState } from '../core/types';

interface NestedSceneState extends SceneObjectState {
  title: string;
  isCollapsed?: boolean;
  canCollapse?: boolean;
  canRemove?: boolean;
  body: SceneLayout;
  actions?: SceneObject[];
}

/**
 * @internal
 * POC status, don't use this yet
 */
export class NestedScene extends SceneObjectBase<NestedSceneState> {
  public static Component = NestedSceneRenderer;

  public onToggle = () => {
    this.setState({
      isCollapsed: !this.state.isCollapsed,
    });
  };

  /** Removes itself from its parent's children array */
  public onRemove = () => {
    const parent = this.parent!;

    if (isSceneLayoutItem(parent)) {
      parent.setState({
        body: undefined,
      });
    }
  };
}

export function NestedSceneRenderer({ model }: SceneComponentProps<NestedScene>) {
  const { title, isCollapsed, canCollapse, canRemove, body, actions } = model.useState();
  const styles = useStyles2(getStyles);

  const toolbarActions = (actions ?? []).map((action) => <action.Component key={action.state.key} model={action} />);

  if (canRemove) {
    toolbarActions.push(
      <ToolbarButton
        icon="times"
        variant={'default'}
        onClick={model.onRemove}
        key="remove-button"
        aria-label="Remove scene"
      />
    );
  }

  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        <Stack gap={0}>
          <div className={styles.title} role="heading" aria-level={1}>
            {title}
          </div>
          {canCollapse && (
            <div className={styles.toggle}>
              <Button
                size="sm"
                icon={isCollapsed ? 'angle-down' : 'angle-up'}
                fill="text"
                variant="secondary"
                aria-label={isCollapsed ? 'Expand scene' : 'Collapse scene'}
                onClick={model.onToggle}
              />
            </div>
          )}
        </Stack>
        <div className={styles.actions}>{toolbarActions}</div>
      </div>
      {!isCollapsed && <body.Component model={body} />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: theme.spacing(1),
    cursor: 'pointer',
  }),
  toggle: css({}),
  title: css({
    fontSize: theme.typography.h5.fontSize,
  }),
  rowHeader: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  }),
  actions: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    justifyContent: 'flex-end',
    flexGrow: 1,
  }),
});

function isSceneLayoutItem(x: SceneObject): x is SceneObject<SceneObjectState & { body: SceneObject | undefined }> {
  return 'body' in x.state;
}

interface StackProps {
  direction?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  wrap?: boolean;
  gap?: number;
  flexGrow?: CSSProperties['flexGrow'];
}

const Stack = ({ children, ...props }: React.PropsWithChildren<StackProps>) => {
  const styles = useStyles2(useCallback((theme) => getStackStyles(theme, props), [props]));

  return <div className={styles.root}>{children}</div>;
};

const getStackStyles = (theme: GrafanaTheme2, props: StackProps) => ({
  root: css({
    display: 'flex',
    flexDirection: props.direction ?? 'row',
    flexWrap: props.wrap ?? true ? 'wrap' : undefined,
    alignItems: props.alignItems,
    gap: theme.spacing(props.gap ?? 2),
    flexGrow: props.flexGrow,
  }),
});
