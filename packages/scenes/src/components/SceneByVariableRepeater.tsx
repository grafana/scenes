import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneLayout, SceneObject, SceneObjectState } from '../core/types';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { VariableValueOption } from '../variables/types';
import { MultiValueVariable } from '../variables/variants/MultiValueVariable';

interface SceneByVariableRepeaterState extends SceneObjectState {
  body: SceneLayout;
  variableName: string;
  getLayoutChild(option: VariableValueOption): SceneObject;
}

export class SceneByVariableRepeater extends SceneObjectBase<SceneByVariableRepeaterState> {
  protected _variableDependency: VariableDependencyConfig<SceneByVariableRepeaterState> = new VariableDependencyConfig(
    this,
    {
      variableNames: [this.state.variableName],
      onVariableUpdateCompleted: () => this.performRepeat(),
    }
  );

  public constructor(state: SceneByVariableRepeaterState) {
    super(state);

    this.addActivationHandler(() => this.performRepeat());
  }

  private performRepeat() {
    if (this._variableDependency.hasDependencyInLoadingState()) {
      return;
    }

    const variable = sceneGraph.lookupVariable(this.state.variableName, this);
    if (!(variable instanceof MultiValueVariable)) {
      console.error('SceneByVariableRepeater: variable is not a MultiValueVariable');
      return;
    }

    const values = getMultiVariableValues(variable);
    const newChildren: SceneObject[] = [];

    for (const option of values) {
      const layoutChild = this.state.getLayoutChild(option);
      newChildren.push(layoutChild);
    }

    this.state.body.setState({ children: newChildren });
  }

  public static Component = ({ model }: SceneComponentProps<SceneByVariableRepeater>) => {
    const { body } = model.useState();
    return <body.Component model={body} />;
  };
}

export function getMultiVariableValues(variable: MultiValueVariable): VariableValueOption[] {
  const { value, text, options } = variable.state;

  if (variable.hasAllValue()) {
    return options;
  }

  if (Array.isArray(value) && Array.isArray(text)) {
    return value.map((v, i) => ({ value: v, label: text[i] as string }));
  }

  return [{ value: value as string, label: text as string }];
}
