import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';
import { sceneGraph } from '../core/sceneGraph';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState, SceneObject } from '../core/types';
import { getUrlSyncManager } from '../services/UrlSyncManager';
import { _patchTimeSrv } from '../utils/compatibility/patchTimeSrv';

export interface EmbeddedSceneState extends SceneObjectState {
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

  public constructor(state: EmbeddedSceneState) {
    super(state);

    this.addActivationHandler(() => {
      // Patching for backwards compatibility with timeSrv in some of core Grafana data sources.
      // Certain core data sources assume a global time range, which is not the case in Scenes.
      // This is patching for a simple case when there is a single global time range in a scene.
      const _unpatchTimeSrv = _patchTimeSrv(sceneGraph.getTimeRange(this));
      return () => {
        _unpatchTimeSrv?.();
        getUrlSyncManager().cleanUp(this);
      };
    });
  }

  /**
   * initUrlSync should be called before the scene is rendered to ensure that objects are in sync
   * before they get activated. This saves some unnecessary re-renders and makes sure variables
   * queries are issued as needed. If your using SceneAppPage you will not need to call this as
   * url sync is handled on the SceneAppPage level not this level.
   */
  public initUrlSync() {
    getUrlSyncManager().initSync(this);
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
      gap: theme.spacing(2),
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
      flexWrap: 'wrap',
    }),
  };
}
