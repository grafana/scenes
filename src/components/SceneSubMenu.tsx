import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneLayoutState, SceneComponentProps } from '../core/types';

interface SceneSubMenuState extends SceneLayoutState {}

export class SceneSubMenu extends SceneObjectBase<SceneSubMenuState> {
  public static Component = SceneSubMenuRenderer;
}

function SceneSubMenuRenderer({ model }: SceneComponentProps<SceneSubMenu>) {
  const { children } = model.useState();
  const className = useStyles2(getStyles);

  return (
    <div className={className}>
      {children.map((child) => (
        <child.Component key={child.state.key} model={child} />
      ))}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  });
}

export class SceneSubMenuSpacer extends SceneObjectBase<{}> {
  public constructor() {
    super({});
  }

  public static Component = (_props: SceneComponentProps<SceneSubMenuSpacer>) => {
    return <div style={{ flexGrow: 1 }} />;
  };
}
