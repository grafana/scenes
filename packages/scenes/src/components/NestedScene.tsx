import { t } from '@grafana/i18n';
import { css, cx } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, ToolbarButton, useStyles2 } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObject, SceneComponentProps, SceneLayout, SceneObjectState } from '../core/types';
import { getSceneGridRowStyles } from './layout/grid/SceneGridRow';
import { sceneGraph } from '../core/sceneGraph';

interface NestedSceneState extends SceneObjectState {
  title: string;
  isCollapsed?: boolean;
  canCollapse?: boolean;
  canRemove?: boolean;
  body: SceneLayout;
  controls?: SceneObject[];
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
  const { title, isCollapsed, canCollapse, canRemove, body, controls } = model.useState();
  const gridRow = useStyles2(getSceneGridRowStyles);
  const styles = useStyles2(getStyles);

  const toolbarControls = (controls ?? []).map((action) => <action.Component key={action.state.key} model={action} />);

  if (canRemove) {
    toolbarControls.push(
      <ToolbarButton
        icon="times"
        variant={'default'}
        onClick={model.onRemove}
        key="remove-button"
        aria-label={t('grafana-scenes.components.nested-scene-renderer.remove-button-label', 'Remove scene')}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={cx(styles.row, isCollapsed && styles.rowCollapsed)}>
        <button
          onClick={model.onToggle}
          className={gridRow.rowTitleButton}
          aria-label={
            isCollapsed
              ? t('grafana-scenes.components.nested-scene-renderer.expand-button-label', 'Expand scene')
              : t('grafana-scenes.components.nested-scene-renderer.collapse-button-label', 'Collapse scene')
          }
        >
          {canCollapse && <Icon name={isCollapsed ? 'angle-right' : 'angle-down'} />}
          <span className={gridRow.rowTitle} role="heading">
            {sceneGraph.interpolate(model, title, undefined, 'text')}
          </span>
        </button>
        <div className={styles.actions}>{toolbarControls}</div>
      </div>
      {!isCollapsed && <body.Component model={body} />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: theme.spacing(1),
  }),
  row: css({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
  }),
  rowCollapsed: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    paddingBottom: theme.spacing(1),
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
