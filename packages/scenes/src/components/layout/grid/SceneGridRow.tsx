import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneLayoutChildComponentProps, SceneObjectUrlValues } from '../../../core/types';
import { SceneObjectUrlSyncConfig } from '../../../services/SceneObjectUrlSyncConfig';
import { SceneDragHandle } from '../../SceneDragHandle';

import { SceneGridLayout } from './SceneGridLayout';
import { GRID_COLUMN_COUNT } from './constants';
import { SceneGridItemLike, SceneGridItemStateLike } from './types';
import { sceneGraph } from '../../../core/sceneGraph';

export interface SceneGridRowState extends SceneGridItemStateLike {
  title: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  children: SceneGridItemLike[];
}

export class SceneGridRow extends SceneObjectBase<SceneGridRowState> {
  public static Component = SceneGridRowRenderer;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['rowc'] });

  public constructor(state: Partial<SceneGridRowState>) {
    super({
      children: state.children || [],
      isCollapsible: state.isCollapsible || true,
      title: state.title || '',
      isDraggable: state.isDraggable || true,
      isResizable: state.isResizable || false,
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

export function SceneGridRowRenderer({ model, isDraggable }: SceneLayoutChildComponentProps<SceneGridRow>) {
  const styles = useStyles2(getSceneGridRowStyles);
  const { isCollapsible, isCollapsed, title, isDraggable: isDraggableLocal } = model.useState();
  const layout = sceneGraph.getLayout(model)!;
  const dragHandle = <SceneDragHandle dragClass={layout.getDragClass!()} />;
  const isDraggableFinal = isDraggable && (isDraggableLocal ?? true);

  return (
    <div className={styles.row}>
      <div className={cx(styles.rowHeader, isCollapsed && styles.rowHeaderCollapsed)}>
        <button onClick={model.onCollapseToggle} className={styles.rowTitleButton}>
          {isCollapsible && <Icon name={isCollapsed ? 'angle-right' : 'angle-down'} />}
          <span className={styles.rowTitle}>{title}</span>
        </button>
        {isDraggableFinal && isCollapsed && <div>{dragHandle}</div>}
      </div>
    </div>
  );
}

const getSceneGridRowStyles = (theme: GrafanaTheme2) => {
  return {
    row: css({
      width: '100%',
      height: '100%',
      position: 'relative',
      zIndex: 0,
      display: 'flex',
      flexDirection: 'column',
    }),
    rowHeader: css({
      width: '100%',
      height: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      border: `1px solid transparent`,
    }),
    rowTitleButton: css({
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      gap: theme.spacing(1),
    }),
    rowHeaderCollapsed: css({
      marginBottom: '0px',
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.borderRadius(1),
    }),
    rowTitle: css({
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
  };
};
