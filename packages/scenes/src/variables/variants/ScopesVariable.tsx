import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { Scope } from '@grafana/data';
import { SceneComponentProps } from '../../core/types';
import { ScopesContext, ScopesContextValue } from '@grafana/runtime';
import React, { ReactNode, useContext, useEffect } from 'react';
import { VariableHide } from '@grafana/schema';
import { SCOPES_VARIABLE_NAME } from '../constants';

export interface ScopesVariableState extends SceneVariableState {
  /**
   * Last captured state from ScopesContext
   */
  scopes: Scope[];
  /**
   * Set to true if you want to the variable to enable / disable scopes when activated / deactivated
   */
  enable?: boolean;
}

export class ScopesVariable extends SceneObjectBase<ScopesVariableState> implements SceneVariable<ScopesVariableState> {
  protected _renderBeforeActivation = true;
  protected _context: ScopesContextValue | undefined;

  public constructor(state: Partial<ScopesVariableState>) {
    super({
      skipUrlSync: true,
      loading: true,
      scopes: [],
      ...state,
      type: 'system',
      name: SCOPES_VARIABLE_NAME,
      hide: VariableHide.hideVariable,
    });
  }

  /**
   * Temporary simple implementation to stringify the scopes.
   */
  public getValue(fieldPath: string): VariableValue {
    const scopes = this.state.scopes ?? [];
    const scopeNames = scopes.map((scope) => scope.metadata.name);
    return scopeNames.join(', ');
  }

  public getScopes(): Scope[] | undefined {
    return this.state.scopes;
  }

  /**
   * This method is used to keep the context up to date with the scopes context received from React
   * 1) Subscribes to ScopesContext state changes and synchronizes it with the variable state
   * 2) Handles enable / disabling of scopes based on variable enable option.
   */
  public setContext(context: ScopesContextValue | undefined) {
    if (!context) {
      return;
    }

    this._context = context;

    const oldState = context.state;

    // Update scopes enable state if state.enable is defined
    if (this.state.enable != null) {
      context.setEnabled(this.state.enable);
    }

    // Subscribe to context state changes
    const sub = context.stateObservable.subscribe((state) => {
      this.updateStateFromContext(state);
    });

    return () => {
      sub.unsubscribe();

      if (this.state.enable != null) {
        context.setEnabled(oldState.enabled);
      }
    };
  }

  public updateStateFromContext(state: { loading: boolean; value: Scope[] }) {
    // There was logic in SceneQueryRunner that said if there are no scopes then loading state should not block query execution
    const loading = state.value.length === 0 ? false : state.loading;
    this.setState({ scopes: state.value, loading });

    if (!loading) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  /**
   * Special function that enables variables to be hidden but still render to access react contexts
   */
  public UNSAFE_hiddenRender(): ReactNode {
    return <ScopesVariableRenderer model={this} />;
  }
}

function ScopesVariableRenderer({ model }: SceneComponentProps<ScopesVariable>) {
  const context = useContext(ScopesContext);

  useEffect(() => {
    return model.setContext(context);
  }, [context, model]);

  return null;
}
