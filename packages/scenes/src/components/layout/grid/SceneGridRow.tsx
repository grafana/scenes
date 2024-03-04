import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject, SceneObjectUrlValues } from '../../../core/types';

import { SceneGridLayout } from './SceneGridLayout';
import { GRID_COLUMN_COUNT } from './constants';
import { SceneGridItemLike, SceneGridItemStateLike } from './types';
import { sceneGraph } from '../../../core/sceneGraph';

export interface SceneGridRowState extends SceneGridItemStateLike {
  title: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  actions?: SceneObject;
  children: SceneGridItemLike[];
}

export class SceneGridRow extends SceneObjectBase<SceneGridRowState> {
  public static Component = SceneGridRowRenderer;

  public constructor(state: Partial<SceneGridRowState>) {
    super({
      children: state.children || [],
      isCollapsible: state.isCollapsible || true,
      title: state.title || '',
      ...state,
      x: 0,
      height: 1,
      width: GRID_COLUMN_COUNT,
    });
  }

  public getGridLayout(): SceneGridLayout {
    const layout = this.parent;

    if (!layout || !(layout instanceof SceneGridLayout)) {
      throw new Error('SceneGridRow must be a child of SceneGridLayout');
    }

    return layout;
  }

  public onCollapseToggle = () => {
    if (!this.state.isCollapsible) {
      return;
    }

    this.getGridLayout().toggleRow(this);
  };

  public getUrlState() {
    return { rowc: this.state.isCollapsed ? '1' : '0' };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (values.rowc == null) {
      return;
    }

    if (values.rowc !== this.getUrlState().rowc) {
      this.onCollapseToggle();
    }
  }
}

export function SceneGridRowRenderer({ model }: SceneComponentProps<SceneGridRow>) {
  const styles = useStyles2(getSceneGridRowStyles);
  const { isCollapsible, isCollapsed, title, actions, children } = model.useState();
  const layout = model.getGridLayout();
  const layoutDragClass = layout.getDragClass();
  const isDraggable = layout.isDraggable();

  const count = children ? children.length : 0;
  const panels = count === 1 ? 'panel' : 'panels';

  return (
    <div className={cx(styles.row, isCollapsed && styles.rowCollapsed)}>
      <div className={styles.rowTitleAndActionsGroup}>
        <button
          onClick={model.onCollapseToggle}
          className={styles.rowTitleButton}
          aria-label={isCollapsed ? 'Expand row' : 'Collapse row'}
        >
          {isCollapsible && <Icon name={isCollapsed ? 'angle-right' : 'angle-down'} />}
          <span className={styles.rowTitle} role="heading">
            {sceneGraph.interpolate(model, title, undefined, 'text')}
          </span>
        </button>
        <span className={cx(styles.panelCount, isCollapsed && styles.panelCountCollapsed)}>
          ({count} {panels})
        </span>
        {actions && 
          <div className={styles.rowActions}>
            <actions.Component model={actions} />
          </div>
        }
      </div>
      {isDraggable && isCollapsed && (
        <div className={cx(styles.dragHandle, layoutDragClass)}>
          <Icon name="draggabledots" />
        </div>
      )}
    </div>
  );
}

export const getSceneGridRowStyles = (theme: GrafanaTheme2) => {
  return {
    row: css({
      width: '100%',
      height: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
    }),
    rowTitleButton: css({
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      gap: theme.spacing(1),
    }),
    rowCollapsed: css({
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    }),
    rowTitle: css({
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    collapsedInfo: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      display: 'flex',
      alignItems: 'center',
      flexGrow: 1,
    }),
    rowTitleAndActionsGroup: css({
      display: 'flex',

      '&:hover, &:focus-within': {
        '& > div': {
          opacity: 1,
        }
      },
    }),
    rowActions: css({
      display: 'flex',
      opacity: 0,
      transition: '200ms opacity ease-in 200ms',

      '&:hover, &:focus-within': {
        opacity: 1,
      },
    }),
    dragHandle: css({
      display: 'flex',
      padding: theme.spacing(0, 1),
      alignItems: 'center',
      justifyContent: 'flex-end',
      cursor: 'move',
      color: theme.colors.text.secondary,
      '&:hover': {
        color: theme.colors.text.primary,
      },
    }),
    panelCount: css({
      paddingLeft: theme.spacing(2),
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      fontSize: theme.typography.size.sm,
      fontWeight: 'normal',
      display: 'none',
      lineHeight: '30px',
    }),
    panelCountCollapsed: css({
      display: 'inline-block',
    }),
  };
};
