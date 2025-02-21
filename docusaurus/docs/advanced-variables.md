---
id: advanced-variables
title: Variables in custom scene objects
---

[Variables](./variables.md) lay the foundation for interactive dashboards. They allow dynamic configuration of which data is queried.

In addition to standard variables support, Scenes provides an API to make [custom scene objects](./advanced-custom-scene-objects.md) work with variables. This API offers many more possibilities for dashboard creators.

## Use variables in a custom scene object

Follow these steps to make a custom scene object reactive to variables.

### Step 1. Build a custom scene object

Start by building a custom scene object that will display provided text.

This object will:

1. Have a simple state that contains a string value (`text` property).
2. Render a `textarea` for state modifications and a preformatted text block for displaying the current value of the `text` state.

```tsx
import { SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';
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

### Step 2. Build a scene with `TextInterpolator`

Create a simple scene with `TextInterpolator`:

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

Define a custom variable and add it to the scene:

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

### Step 4. Add variables support to the `TextInterpolator` object

Use `VariableDependencyConfig` to make `TextInterpolator` reactive to variable changes. Define a `protected _variableDependency` instance property in `TextInterpolator` that's an instance of `VariableDependencyConfig`:

```tsx
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
```

`VariableDependencyConfig` accepts an object with the following configuration options:

- `statePaths` - Configures which properties of the object state can contain variables. Use `['*']` to refer to any property of the object state.
- `onReferencedVariableValueChanged` - Configures a callback that will be executed when variable(s) that the object depends on are changed.

:::note
If `onReferencedVariableValueChanged` is not specified for the `VariableDependencyConfig`, the object will re-render on variable change by default.
:::

### Step 5. Interpolate `text` property in the component

In the `TextInterpolatorRenderer` component, use the `sceneGraph.interpolate` helper to replace variables in the `text` property when the variable changes:

```tsx
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
```

The preceding code will render a scene with a template variable, text input, and a preformatted text block. Modify the text in the text input to `${greetings} World!`, and the preformatted text box will update. Change the variable value at the top of the scene, and that will also update the preformatted text block.

### Custom variable macros

You can register a custom variable macro using `sceneUtils.registerVariableMacro`. A variable macro is useful for variable expressions you want to be evaluted dynamically based on some context. Examples of core variables
that are implemented as macros.

- `${__url.params:include:var-from,var-to}`
- `${__user.login}`

Example:

```ts
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
```

### Waiting for variables

When you have state logic that depends on variables you can check if all your variable dependencies are ready (non loading state) with `sceneGraph.hasVariableDependencyInLoadingState`. This will return true if any dependency is in a loading state, includes checks of the complete dependency chain.

For objects that subscribe to both time & variable we recommend using `VariableDependencyConfig` and it's `onVariableUpdateCompleted` callback and `hasDependencyInLoadingState` function. Since variables can also react and change based on time and to avoid double reactions the `VariableDependencyConfig` has internal state to remember that a scene object is waiting for variables. To leverage this specify the `onVariableUpdateCompleted` callback. This callback is called whenever a dependency changes value or if the scene object is waiting for variables, when a variable update process is completed.

Example setup:

Variables: A, B, C (B depends on A, C depends on B). A depends on time range so when ever time range change it will load new values which could result in a new value (which would then cause B and C to also update).

SceneQueryRunner with a query that depends on variable C

- 1. Time range changes value
- 2. Variable A starts loading
- 3. SceneQueryRunner responds to time range change tries to start new query, but before new query is issued calls `variableDependency.hasDependencyInLoadingState`. This checks if variable C is loading wich it is not, so then checks if variable B is loading (since it's a dependency of C), which it is not so then checks A, A is loading so it returns true and SceneQueryRunner will skip issuing a new query. When this happens the VariableDependencyConfig will set an internal flag that it is waiting for a variable dependency, this makes sure that the moment a next variable completes onVariableUpdateCompleted is called (no matter if the variable that was completed is a direct dependency or if it has changed value or not, we just care that it completed loading).
- 4. Variable A completes loading. The options (possible values) are the same so no change value.
- 5. SceneQueryRunner's VariableDependencyConfig receives the notification that variable A has completed it's loading phase, since it is in a waiting for variables state it will call the onVariableUpdateCompleted callback even though A is not a direct dependency and it has not changed value.

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-variables.tsx)
