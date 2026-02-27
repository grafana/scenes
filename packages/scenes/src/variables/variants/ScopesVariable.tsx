import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  CustomVariableValue,
  SceneVariable,
  SceneVariableState,
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
} from '../types';
import { Scope } from '@grafana/data';
import { SceneComponentProps } from '../../core/types';
import { ScopesContext, ScopesContextValue } from '@grafana/runtime';
import { useContext, useEffect } from 'react';
import { VariableFormatID, VariableHide } from '@grafana/schema';
import { SCOPES_VARIABLE_NAME } from '../constants';
import { isEqual } from 'lodash';
import { getQueryController } from '../../core/sceneGraph/getQueryController';
import { SCOPES_CHANGED_INTERACTION } from '../../performance/interactionConstants';
import { Observable, Subject, of } from 'rxjs';

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

  // Special options that enables variables to be hidden but still render to access react contexts
  public UNSAFE_renderAsHidden = true;
  public static Component = ScopesVariableRenderer;
  private _validateAndUpdateObs?: Subject<ValidateAndUpdateResult>;

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

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    if (!this.state.loading) {
      this._validateAndUpdateObs = undefined;
      return of({});
    }

    this._validateAndUpdateObs = new Subject<ValidateAndUpdateResult>();
    return this._validateAndUpdateObs;
  }

  /**
   * Temporary simple implementation to stringify the scopes.
   */
  public getValue(): VariableValue {
    const scopes = this.state.scopes ?? [];
    return new ScopesVariableFormatter(scopes.map((scope) => scope.metadata.name));
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
    const oldScopes = this.state.scopes.map((scope) => scope.metadata.name);
    const newScopes = state.value.map((scope) => scope.metadata.name);
    const scopesHaveChanged = !isEqual(oldScopes, newScopes);

    // Only update scopes value state when loading is false and the scopes have changed
    if (!loading && (scopesHaveChanged || newScopes.length === 0)) {
      const queryController = getQueryController(this);
      queryController?.startProfile(SCOPES_CHANGED_INTERACTION);
      this.setState({ scopes: state.value, loading });
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
      // Signals to SceneVariableSet that we have a value
      this._validateAndUpdateObs?.next({});
    } else {
      this.setState({ loading });
    }
  }
}

function ScopesVariableRenderer({ model }: SceneComponentProps<ScopesVariable>) {
  const context = useContext(ScopesContext);

  useEffect(() => {
    return model.setContext(context);
  }, [context, model]);

  return null;
}

export class ScopesVariableFormatter implements CustomVariableValue {
  public constructor(private _value: string[]) {}

  public formatter(formatNameOrFn?: string): string {
    if (formatNameOrFn === VariableFormatID.QueryParam) {
      return this._value.map((scope) => `scope=${encodeURIComponent(scope)}`).join('&');
    }

    return this._value.join(', ');
  }
}
