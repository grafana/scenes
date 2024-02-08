import React from 'react';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectUrlValues } from '../../core/types';
import { SceneObjectUrlSyncConfig } from '../../services/SceneObjectUrlSyncConfig';
import { VariableValueInput } from '../components/VariableValueInput';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';

export interface TextBoxVariableState extends SceneVariableState {
  value: string;
}

export class TextBoxVariable
  extends SceneObjectBase<TextBoxVariableState>
  implements SceneVariable<TextBoxVariableState>
{
  public constructor(initialState: Partial<TextBoxVariableState>) {
    super({
      type: 'textbox',
      value: '',
      name: '',
      ...initialState,
    });

    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
  }

  public getValue(): VariableValue {
    return this.state.value;
  }

  public setValue(newValue: string) {
    if (newValue !== this.state.value) {
      this.setState({ value: newValue });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  private getKey(): string {
    return `var-${this.state.name}`;
  }

  public getUrlState() {
    return { [this.getKey()]: this.state.value };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const update: Partial<TextBoxVariableState> = {};
    const val = values[this.getKey()];
    if (typeof val === 'string') {
      update.value = val;
    }

    this.setState(update);
  }

  public static Component = ({ model }: SceneComponentProps<TextBoxVariable>) => {
    return <VariableValueInput model={model} />;
  };
}
