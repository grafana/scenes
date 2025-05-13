import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { Scope } from '@grafana/data';
import { SceneComponentProps } from '../../core/types';
import { ScopesContextValue, useScopes } from '@grafana/runtime';
import { useEffect } from 'react';

export interface ScopesVariableState extends SceneVariableState {
  scopes?: Scope[];
}

export class ScopesVariable extends SceneObjectBase<ScopesVariableState> implements SceneVariable<ScopesVariableState> {
  static Component = ScopesVariableRenderer;

  private _context: ScopesContextValue | undefined;
  protected _renderBeforeActivation = true;

  public constructor(state: Partial<ScopesVariableState>) {
    super({
      skipUrlSync: true,
      ...state,
      type: 'system',
      name: '__scopes',
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    const context = this._context;

    if (!context) {
      console.warn('ScopesVariable: No scopes context found');
      return;
    }

    context.setEnabled(true);
    console.log('Enabling scopes');

    return () => {
      context!.setEnabled(false);
      console.log('Disabling scopes');
    };
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
   *
   * Its rationale is:
   *   - When a new context is available, check if we have pending scopes passed from the URL
   *      - If we have pending scopes, ask the new context to load them
   *      - The loading should happen in a setTimeout to allow the existing context to pass its values to the URL sync handler
   *   - If a new context is received, propagate it as a new value in the behavior subject
   *   - If a new value is received, force a re-render to trigger the URL sync handler
   */
  public updateContext(newContext: ScopesContextValue | undefined) {
    if (this._context !== newContext || this._context?.state !== newContext?.state) {
      this._context = newContext;
      this.setState({ loading: newContext?.state.loading, scopes: newContext?.state.value });

      if (!this.state.loading) {
        this.publishEvent(new SceneVariableValueChangedEvent(this), true);
      }
    }
  }
}

function ScopesVariableRenderer({ model }: SceneComponentProps<ScopesVariable>) {
  const context = useScopes();

  useEffect(() => {
    model.updateContext(context);
  }, [context, model]);

  return null;
}
