import { isEqual } from 'lodash';
import { useEffect } from 'react';
import { BehaviorSubject, filter, map, Observable, pairwise, Unsubscribable } from 'rxjs';

import { Scope } from '@grafana/data';
import { ScopesContextValue, useScopes } from '@grafana/runtime';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneComponentProps } from './types';

export class SceneScopesBridge extends SceneObjectBase {
  static Component = SceneScopesBridgeRenderer;

  protected _renderBeforeActivation = true;

  private _contextSubject = new BehaviorSubject<ScopesContextValue | undefined>(undefined);

  public getValue(): Scope[] {
    return this.context?.state.value ?? [];
  }

  /**
   * Emits values of the selected scopes array. It emits the current value and the previous value if there is a change.
   * @param cb
   */
  public subscribeToValue(cb: (newScopes: Scope[], prevScopes: Scope[]) => void): Unsubscribable {
    return this.contextObservable
      .pipe(
        map((context) => context?.state.value ?? []),
        pairwise(),
        filter(([prevScopes, newScopes]) => !isEqual(prevScopes, newScopes))
      )
      .subscribe(([prevScopes, newScopes]) => {
        cb(newScopes, prevScopes);
      });
  }

  public isLoading(): boolean {
    return this.context?.state.loading ?? false;
  }

  public subscribeToLoading(cb: (loading: boolean) => void): Unsubscribable {
    return this.contextObservable
      .pipe(
        filter((context) => !!context),
        pairwise(),
        map(
          ([prevContext, newContext]) =>
            [prevContext?.state.loading ?? false, newContext?.state.loading ?? false] as [boolean, boolean]
        ),
        filter(([prevLoading, newLoading]) => prevLoading !== newLoading)
      )
      .subscribe(([_prevLoading, newLoading]) => {
        cb(newLoading);
      });
  }

  public setEnabled(enabled: boolean) {
    this.context?.setEnabled(enabled);
  }

  public setReadOnly(readOnly: boolean) {
    this.context?.setReadOnly(readOnly);
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
    if (this.context !== newContext || this.context?.state !== newContext?.state) {
      this._contextSubject.next(newContext);
    }
  }

  private get context(): ScopesContextValue | undefined {
    return this._contextSubject.getValue();
  }

  private get contextObservable(): Observable<ScopesContextValue | undefined> {
    return this._contextSubject.asObservable();
  }
}

function SceneScopesBridgeRenderer({ model }: SceneComponentProps<SceneScopesBridge>) {
  const context = useScopes();

  useEffect(() => {
    model.updateContext(context);
  }, [context, model]);

  return null;
}

export interface ScopesBridgeParentState {
  scopesBridge?: SceneScopesBridge;
}

export function isScopesBridgeParent(obj: Object): obj is ScopesBridgeParentState {
  return 'scopesBridge' in obj;
}
