import React, { CSSProperties } from 'react';

import { Field, Input } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneLayoutChildState } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';

export interface SceneCanvasTextState extends SceneLayoutChildState {
  text: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Not a really useful component, just an example of how to create one
 * @internal
 */
export class SceneCanvasText extends SceneObjectBase<SceneCanvasTextState> {
  public static Editor = Editor;

  protected _variableDependency = new VariableDependencyConfig(this, { statePaths: ['text'] });

  public static Component = ({ model }: SceneComponentProps<SceneCanvasText>) => {
    const { text, fontSize = 20, align = 'left', key } = model.useState();

    const style: CSSProperties = {
      fontSize: fontSize,
      display: 'flex',
      flexGrow: 1,
      alignItems: 'center',
      padding: 16,
      justifyContent: align,
    };

    return (
      <div style={style} data-testid={key}>
        {sceneGraph.interpolate(model, text)}
      </div>
    );
  };
}

function Editor({ model }: SceneComponentProps<SceneCanvasText>) {
  const { fontSize } = model.useState();

  return (
    <Field label="Font size">
      <Input
        type="number"
        defaultValue={fontSize}
        onBlur={(evt) => model.setState({ fontSize: parseInt(evt.currentTarget.value, 10) })}
      />
    </Field>
  );
}
