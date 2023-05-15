---
id: advanced-variables
title: Variables in custom scene objects
---

Variables lay a foundation for interactive dashboards. They allow dynamic configuration of what data is queried. Read more about [basic variables usage in Scenes](./variables.md).

On top of standard variables support, Scenes provide an API to make custom scene objects work with variables. [Read more about custom scene objects in Scenes](./advanced-custom-scene-objects.md). This APIs offers a whole lot more possibilities for dashboard creators.

## Use variables in custom scene object

Follow the steps to make a custom scene object reactive to variables.

### Step 1. Build a custom scene object

Start with building a custom scene object that will display provided text.

This object:

1. Will have a simple state that contains a string value(`text` property).
2. Will render a textarea for state modifications and a preformatted text block for displaying the current value of the `text` state.

```tsx
import { SceneObjectState, SceneObjectState, SceneComponentProps } from '@grafana/scenes';
import { TextArea } from '@grafana/ui';

interface TextInterpolatorState extends SceneObjectState {
  text: string;
}

class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {
  static Component = TextInterpolatorRenderer;

  constructor(text: string) {
    super({ text });
  }

  onTextChange = (text: string) => {
    this.setState({ text });
  };
}

function TextInterpolatorRenderer({ model }: SceneComponentProps<TextInterpolator>) {
  const { text } = model.useState();
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <TextArea defaultValue={text} onBlur={(e) => model.onTextChange(e.currentTarget.value)} />
      </div>
      <pre>{model.state.text}</pre>
    </div>
  );
}
```

### Step 2. Build a scene to render `TextInterpolator` object

Create a simple scene with `TextInterpolator`.

```tsx
const scene = new EmbeddedScene({
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
```

### Step 3. Add a variable to a scene

Define a custom variable and add it to scene:

```tsx
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
```

### Step 4. Add variables support to `TextInterpolator` object

Use `VariableDependencyConfig` to make `TextInterpolator` responsive to variable changes. Define `protected _variableDependency` instance property in `TextInterpolator` that's an instance of `VariableDependencyConfig`:

```tsx
class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {
  static Component = TextInterpolatorRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['text'],
    onReferencedVariableValueChanged: () => this.onVariableChange(),
  });

  constructor(text: string) {
    super({ text });
  }

  onTextChange = (text: string) => {
    this.setState({ text });
  };

  onVariableChange() {
    // TODO, see next step
  }
}
```

`VariableDependencyConfig` accepts an object with the following configuration options:

- `statePaths` - Configure which properties of object state can contain variables.
- `onReferencedVariableValueChanged` - Configure a callback that will be executed when variable(s) that the object depends on changed.

### Step 5. Add callback to handle referenced variables changes

Introduce a new property `interpolatedText` to `TextInterpolatorState` that will contain the provided text, but with variables interpolated:

```tsx
interface TextInterpolatorState extends SceneObjectState {
  text: string;
  interpolatedText?: string;
}
```

Use it to show the preformatted text block in the component:

```tsx
function TextInterpolatorRenderer({ model }: SceneComponentProps<TextInterpolator>) {
  const { text, interpolatedText } = model.useState();
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <TextArea defaultValue={text} onBlur={(e) => model.onTextChange(e.currentTarget.value)} />
      </div>
      <pre>{interpolatedText}</pre>
    </div>
  );
}
```

Modify the `TextInterpolator` code to store interpolated value of the provided text. Use `sceneGraph.interpolate` helper to replace variables used in `text` with the correct value.

```tsx
class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {
  static Component = TextInterpolatorRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['text'],
    onReferencedVariableValueChanged: () => this.onVariableChange(),
  });

  constructor(text: string) {
    super({ text, interpolatedText: text });

    this.addActivationHandler(() => {
      this.setState({
        interpolatedText: sceneGraph.interpolate(this, this.state.text),
      });
    });
  }

  onTextChange = (text: string) => {
    this.setState({ text, interpolatedText: sceneGraph.interpolate(this, text) });
  };

  onVariableChange() {
    // TODO, see next step
  }
}
```

Implement `onVariableChange` method to update `interpolatedText` state when a used variable changes:

```tsx
class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {
  static Component = TextInterpolatorRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['text'],
    onReferencedVariableValueChanged: () => this.onVariableChange(),
  });

  constructor(text: string) {
    super({ text, interpolatedText: text });

    this.addActivationHandler(() => {
      this.setState({
        interpolatedText: sceneGraph.interpolate(this, this.state.text),
      });
    });
  }

  onTextChange = (text: string) => {
    this.setState({ text, interpolatedText: sceneGraph.interpolate(this, text) });
  };

  onVariableChange = () => {
    this.setState({ interpolatedText: sceneGraph.interpolate(this, this.state.text) });
  };
}
```

The preceding code will render a scene with a template variable, text input and a preformatted text block. Modify the text in the text input to `${greetings} World!` and observe the preformatted text box update. Change the variable value at the top of the scene and watch the preformatted text block update.
