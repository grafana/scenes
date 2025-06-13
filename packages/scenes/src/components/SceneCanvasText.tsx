import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

export interface SceneCanvasTextState extends SceneObjectState {
  text: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  spacing?: number;
}

/**
 * Not a really useful component, just an example of how to create one
 * @internal
 */
export class SceneCanvasText extends SceneObjectBase<SceneCanvasTextState> {
  protected _variableDependency = new VariableDependencyConfig(this, { statePaths: ['text'] });

  public static Component = SceneCanvasTextRenderer;
}

function SceneCanvasTextRenderer({ model }: SceneComponentProps<SceneCanvasText>) {
  const { text, fontSize = 20, align = 'left', key, spacing } = model.useState();
  const theme = useTheme2();

  const style = css({
    fontSize: fontSize,
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing ? theme.spacing(spacing, 0) : undefined,
    justifyContent: align,
  });

  return (
    <div className={style} data-testid={key}>
      {sceneGraph.interpolate(model, text)}
    </div>
  );
}
