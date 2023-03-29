import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, ToolbarButton, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import {
  SceneObject,
  SceneLayoutChildState,
  SceneComponentProps,
  SceneLayout,
  SceneLayoutItemState,
} from '../core/types';

interface NestedSceneState extends SceneLayoutChildState {
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
      placement: {
        ...this.state.placement,
        ySizing: this.state.isCollapsed ? 'fill' : 'content',
      },
    });
  };

  /** Removes itself from its parent's children array */
  public onRemove = () => {
    const parent = this.parent!;
    if ('children' in parent.state) {
      parent.setState({
        children: parent.state.children.filter((x) => x !== this),
      });
    }

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

function isSceneLayoutItem(x: SceneObject): x is SceneObject<SceneLayoutItemState> {
  return 'body' in x.state;
}
