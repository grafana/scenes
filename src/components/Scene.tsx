import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectStatePlain, SceneObject } from '../core/types';
import { UrlSyncManager } from '../services/UrlSyncManager';

export interface SceneState extends SceneObjectStatePlain {
  title: string;
  body: SceneObject;
  actions?: SceneObject[];
  subMenu?: SceneObject;
  isEditing?: boolean;
}

export class EmbeddedScene extends SceneObjectBase<SceneState> {
  public static Component = EmbeddedSceneRenderer;

  private urlSyncManager?: UrlSyncManager;

  public activate() {
    super.activate();
    this.urlSyncManager = new UrlSyncManager(this);
    this.urlSyncManager.initSync();
  }

  public deactivate() {
    super.deactivate();
    this.urlSyncManager!.cleanUp();
  }
}

function EmbeddedSceneRenderer({ model }: SceneComponentProps<EmbeddedScene>) {
  const { body, isEditing, subMenu } = model.useState();
  return (
    <div
      style={{
        flexGrow: 1,
        display: 'flex',
        gap: '8px',
        overflow: 'auto',
        minHeight: '100%',
        flexDirection: 'column',
      }}
    >
      {subMenu && <subMenu.Component model={subMenu} />}
      <div style={{ flexGrow: 1, display: 'flex', gap: '8px', overflow: 'auto' }}>
        <body.Component model={body} isEditing={isEditing} />
      </div>
    </div>
  );
}
