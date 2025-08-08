import { IconName, Input, ToolbarButton } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { ControlsLabel } from '../utils/ControlsLabel';

export interface ToolbarButtonState extends SceneObjectState {
  icon: IconName;
  onClick: () => void;
}

export class SceneToolbarButton extends SceneObjectBase<ToolbarButtonState> {
  public static Component = ({ model }: SceneComponentProps<SceneToolbarButton>) => {
    const state = model.useState();

    return <ToolbarButton onClick={state.onClick} icon={state.icon} />;
  };
}

export interface SceneToolbarInputState extends SceneObjectState {
  value?: string;
  label?: string;
  onChange: (value: number) => void;
}

export class SceneToolbarInput extends SceneObjectBase<SceneToolbarInputState> {
  public static Component = ({ model }: SceneComponentProps<SceneToolbarInput>) => {
    const state = model.useState();

    return (
      <div style={{ display: 'flex' }}>
        {state.label && <ControlsLabel label={state.label} />}
        <Input
          defaultValue={state.value}
          width={8}
          onBlur={(evt) => {
            model.state.onChange(parseInt(evt.currentTarget.value, 10));
          }}
        />
      </div>
    );
  };
}
