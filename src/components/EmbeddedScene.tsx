import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectStatePlain, SceneObject } from '../core/types';
import { UrlSyncManager } from '../services/UrlSyncManager';

export interface EmbeddedSceneState extends SceneObjectStatePlain {
  /**
   * The main content of the scene (usually a SceneFlexLayout)
   */
  body: SceneObject;
  /**
   * Top row of variable selectors, filters, time pickers and custom actions.
   */
  controls?: SceneObject[];
}

export class EmbeddedScene extends SceneObjectBase<EmbeddedSceneState> {
  public static Component = EmbeddedSceneRenderer;

  private urlSyncManager?: UrlSyncManager;

  /**
   * initUrlSync should be called before the scene is rendered to ensure that objects are in sync
   * before they get activated. This saves some unnecessary re-renders and makes sure variables
   * queries are issued as needed.
   */
  public initUrlSync() {
    this.urlSyncManager = new UrlSyncManager(this);
    this.urlSyncManager.initSync();
  }

  public activate() {
    super.activate();
  }

  public deactivate() {
    super.deactivate();
    if (this.urlSyncManager) {
      this.urlSyncManager!.cleanUp();
    }
  }
}

function EmbeddedSceneRenderer({ model }: SceneComponentProps<EmbeddedScene>) {
  const { body, controls } = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      {controls && (
        <div className={styles.controls}>
          {controls.map((control) => (
            <control.Component key={control.state.key} model={control} />
          ))}
        </div>
      )}
      <div className={styles.body}>
        <body.Component model={body} />
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      flexGrow: 1,
      display: 'flex',
      gap: '8px',
      minHeight: '100%',
      flexDirection: 'column',
    }),
    body: css({
      flexGrow: 1,
      display: 'flex',
      gap: '8px',
    }),
    controls: css({
      display: 'flex',
      gap: theme.spacing(1),
      alignItems: 'center',
    }),
  };
}
