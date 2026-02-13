import React from 'react';
import { Observable, of } from 'rxjs';
import { Switch, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectUrlValues } from '../../core/types';
import { SceneObjectUrlSyncConfig } from '../../services/SceneObjectUrlSyncConfig';
import {
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
} from '../types';

export interface SwitchVariableState extends SceneVariableState {
  value: string;
  enabledValue: string;
  disabledValue: string;
}

export class SwitchVariable extends SceneObjectBase<SwitchVariableState> implements SceneVariable<SwitchVariableState> {
  public static Component = SwitchVariableRenderer;
  private _prevValue: VariableValue = '';

  public constructor(initialState: Partial<SwitchVariableState>) {
    super({
      type: 'switch',
      value: 'false',
      enabledValue: 'true',
      disabledValue: 'false',
      name: '',
      ...initialState,
    });

    this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => this.getKeys() });
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

  public setValue(newValue: string): void {
    // Ignore if there's no change
    if (this.getValue() === newValue) {
      return;
    }

    if ([this.state.enabledValue, this.state.disabledValue].includes(newValue)) {
      this.setState({ value: newValue });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    } else {
      console.error(
        `Invalid value for switch variable: "${newValue}". Valid values are: "${this.state.enabledValue}" and "${this.state.disabledValue}".`
      );
    }
  }

  public getValue(): VariableValue {
    return this.state.value;
  }

  public isEnabled(): boolean {
    return this.state.value === this.state.enabledValue;
  }

  public isDisabled(): boolean {
    return this.state.value === this.state.disabledValue;
  }

  private getKey(): string {
    return `var-${this.state.name}`;
  }

  public getKeys(): string[] {
    if (this.state.skipUrlSync) {
      return [];
    }

    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    if (this.state.skipUrlSync) {
      return {};
    }

    return { [this.getKey()]: this.state.value };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    const val = values[this.getKey()];

    if (typeof val === 'string') {
      this.setValue(val);
    }
  }
}

function SwitchVariableRenderer({ model }: SceneComponentProps<SwitchVariable>) {
  const state = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Switch
        id={`var-switch-${state.key}`}
        value={state.value === state.enabledValue}
        onChange={(event) => {
          model.setValue(event!.currentTarget.checked ? state.enabledValue : state.disabledValue);
        }}
      />
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      height: theme.spacing(theme.components.height.md),
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.components.input.borderColor}`,
      background: theme.colors.background.primary,
    }),
  };
}
