import { t, Trans } from '@grafana/i18n';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { CustomScrollbar, Drawer, ToolbarButton, useStyles2 } from '@grafana/ui';
import { useState } from 'react';

import { SceneObject } from '../../core/types';
import { DebugDetails } from './DebugDetails';
import { DebugTreeNode } from './DebugTreeNode';

export interface Props {
  scene: SceneObject;
}

/**
 * @internal
 * Please don't use from plugins directly.
 * This is already exposed via SceneAppPage and the ?scene-debugger query parameter.
 *
 * This is only exported so that core dashboards can use it.
 */
export function SceneDebugger({ scene }: Props) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SceneObject>();

  return (
    <>
      <ToolbarButton variant="canvas" icon="bug" onClick={() => setIsOpen(true)} />
      {isOpen && (
        <Drawer
          title={t('grafana-scenes.components.scene-debugger.title-scene-debugger', 'Scene debugger')}
          onClose={() => setIsOpen(false)}
          size="lg"
        >
          <div className={styles.panes}>
            <div className={styles.pane1}>
              <div className={styles.paneHeading}>
                <Trans i18nKey="grafana-scenes.components.scene-debugger.scene-graph">Scene graph</Trans>
              </div>
              <CustomScrollbar autoHeightMin={'100%'}>
                <div className={styles.treeWrapper}>
                  <DebugTreeNode node={scene} selectedObject={selectedObject} onSelect={setSelectedObject} />
                </div>
              </CustomScrollbar>
            </div>
            <div className={styles.pane2}>
              <div className={styles.paneHeading}>
                <Trans i18nKey="grafana-scenes.components.scene-debugger.object-details">Object details</Trans>
              </div>
              {selectedObject && <DebugDetails node={selectedObject} />}
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    panes: css({
      flexGrow: 1,
      display: 'flex',
      height: '100%',
      flexDirection: 'row',
      marginTop: theme.spacing(-2),
    }),
    pane1: css({
      flexGrow: 0,
      display: 'flex',
      height: '100%',
      flexDirection: 'column',
      borderRight: `1px solid ${theme.colors.border.weak}`,
    }),
    pane2: css({
      flexGrow: 1,
      display: 'flex',
      minHeight: '100%',
      flexDirection: 'column',
      paddingLeft: theme.spacing(2),
    }),
    treeWrapper: css({
      paddingRight: theme.spacing(2),
      height: '100%',
      marginLeft: theme.spacing(-1),
    }),
    paneHeading: css({
      padding: theme.spacing(1, 0),
      fontWeight: theme.typography.fontWeightMedium,
    }),
  };
}
