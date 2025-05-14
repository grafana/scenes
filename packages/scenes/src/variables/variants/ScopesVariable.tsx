import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { Scope } from '@grafana/data';
import { SceneComponentProps } from '../../core/types';
import { ScopesContext, ScopesContextValue } from '@grafana/runtime';
import React, { ReactNode, useContext, useEffect } from 'react';
import { VariableHide } from '@grafana/schema';

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
      name: '__scopes',
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
   */
  public setContext(context: ScopesContextValue | undefined) {
    if (!context) {
      return;
    }

    this._context = context;

    const oldState = context.state;

    // if scopesEnabled has value we enabled or disabled scopes
    // scopesEnabled option allows scenes to disable or enable scopes when the variable is activated
    // or leave it undefined allowing the app to enable it on a higher level (using useScopes)
    if (this.state.enable != null) {
      context.setEnabled(this.state.enable);
    }

    // Subscribe to context state changes
    const sub = context.stateObservable.subscribe((state) => {
      console.log('ScopesContext stateObservable update', state);
      this.updateStateFromContext(state);
    });

    return () => {
      sub.unsubscribe();

      if (this.state.enable != null) {
        context.setEnabled(oldState.enabled);
      }
    };
  }

  private updateStateFromContext(state: ScopesContextValue['state']) {
    // There was logic in SceneQueryRunner that said if there are no scopes then loading state should not block query execution
    const loading = state.value.length === 0 ? false : state.loading;
    this.setState({ scopes: state.value, loading });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
  }

  /**
   * Special function that enables variables to be hidden but still render to access react contexts
   */
  public hiddenRender(): ReactNode {
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
