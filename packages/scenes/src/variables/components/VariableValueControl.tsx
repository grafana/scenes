import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { ControlsLayout, SceneComponentProps, SceneObjectState } from '../../core/types';
import { VariableValueSelectWrapper } from './VariableValueSelectors';

export interface VariableValueControlState extends SceneObjectState {
  layout?: ControlsLayout;
  /** Render the specific select control for a variable */
  variableName: string;
  /** Hide the label in the variable value controller */
  hideLabel?: boolean;
}

export class VariableValueControl extends SceneObjectBase<VariableValueControlState> {
  public static Component = VariableValueControlRenderer;
}

function VariableValueControlRenderer({ model }: SceneComponentProps<VariableValueControl>) {
  const variable = sceneGraph.lookupVariable(model.state.variableName, model);
  if (!variable) {
    return null;
  }

  return (
    <VariableValueSelectWrapper
      key={variable.state.key}
      variable={variable}
      layout={model.state.layout}
      showAlways={true}
    />
  );
}
