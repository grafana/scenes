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
  FormatVariable,
  SceneObject,
  sceneUtils,
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

export function getVariablesSceneWithCustomMacro() {
  const scene = new EmbeddedScene({
    // Attach the a behavior to the SceneApp or top level scene object that registers and unregisters the macro
    $behaviors: [registerMacro],
    controls: [new VariableValueSelectors({})],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: new TextInterpolator('Testing my macro ${__sceneInfo.key}'),
        }),
      ],
    }),
  });

  return scene;
}

/**
 * Macro to support ${__sceneInfo.<stateKey>} which will evaluate to the state key value of the
 * context scene object where the string is interpolated.
 */
export class MyCoolMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, private _context: SceneObject) {
    this.state = { name: name, type: '__sceneInfo' };
  }

  public getValue(fieldPath?: string) {
    if (fieldPath) {
      return (this._context.state as any)[fieldPath];
    }

    return this._context.state.key!;
  }

  public getValueText?(): string {
    return '';
  }
}

function registerMacro() {
  const unregister = sceneUtils.registerVariableMacro('__sceneInfo', MyCoolMacro);
  return () => unregister();
}
