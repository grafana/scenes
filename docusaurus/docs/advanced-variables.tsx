import React from 'react';
import {
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  EmbeddedScene,
  SceneFlexItem,
  SceneFlexLayout,
  SceneVariableSet,
  VariableValueSelectors,
  VariableDependencyConfig,
  CustomVariable,
  sceneGraph,
} from '@grafana/scenes';
import { TextArea } from '@grafana/ui';

export function getAdvancedVariablesScene() {
  const greetingsVar = new CustomVariable({
    name: 'greetings',
    query: 'Hello , Hola , Bonjour , Ahoj',
  });

  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [greetingsVar] }),
    controls: [new VariableValueSelectors({})],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: new TextInterpolator('Hello world'),
        }),
      ],
    }),
  });

  return scene;
}

interface TextInterpolatorState extends SceneObjectState {
  text: string;
}

class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {
  static Component = TextInterpolatorRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['text'],
  });

  constructor(text: string) {
    super({ text });
  }

  onTextChange = (text: string) => {
    this.setState({ text });
  };
}

function TextInterpolatorRenderer({ model }: SceneComponentProps<TextInterpolator>) {
  const { text } = model.useState();
  const interpolatedText = sceneGraph.interpolate(model, text);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <TextArea defaultValue={text} onBlur={(e) => model.onTextChange(e.currentTarget.value)} />
      </div>
      <pre>{interpolatedText}</pre>
    </div>
  );
}
