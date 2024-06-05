import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState, SceneObject } from '../core/types';
import { getUrlSyncManager } from '../services/UrlSyncManager';
import { setWindowGrafanaSceneContext } from '../utils/compatibility/setWindowGrafanaSceneContext';

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
      // This function is setting window.__grafanaSceneContext which is used from Grafana core in the old services TimeSrv and TemplateSrv.
      // This works as a backward compatability method to support accessing scene time range and variables from those old services.
      const unsetGlobalScene = setWindowGrafanaSceneContext(this);
      return () => {
        unsetGlobalScene();
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

const getStyles = (theme: GrafanaTheme2) => {
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
      gap: theme.spacing(1),
    }),
    controls: css({
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'flex-end',
      flexWrap: 'wrap',
    }),
  };
};
