import React from 'react';
import { Observable, of } from 'rxjs';
import { Switch } from '@grafana/ui';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import {
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
} from '../types';
import { SceneComponentProps } from '../../core/types';

export interface SwitchVariableState extends SceneVariableState {
  value: boolean;
}

export class SwitchVariable extends SceneObjectBase<SwitchVariableState> implements SceneVariable<SwitchVariableState> {
  public static Component = SwitchVariableRenderer;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['value'],
  });

  private _prevValue: VariableValue = '';

  public constructor(initialState: Partial<SwitchVariableState>) {
    super({
      type: 'switch',
      value: false,
      name: '',
      ...initialState,
    });
  }

  /**
   * This function is called on when SceneVariableSet is activated or when a dependency changes.
   */
  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    const newValue = this.getValue();

    if (this._prevValue !== newValue) {
      this._prevValue = newValue;
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }

    return of({});
  }

  public setValue(newValue: boolean): void {
    // Ignore if there's no change
    if (this.getValue() === newValue) {
      return;
    }

    this.setState({ value: Boolean(newValue) });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }

  public getValue(): VariableValue {
    return Boolean(this.state.value);
  }
}

function SwitchVariableRenderer({ model }: SceneComponentProps<SwitchVariable>) {
  const state = model.useState();

  return (
    <Switch
      disabled={false}
      value={state.value}
      onChange={(event) => {
        model.setValue(event!.currentTarget.checked);
      }}
    />
  );
}
