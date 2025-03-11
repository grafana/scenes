import { isEqual } from 'lodash';
import { useEffect } from 'react';
import { BehaviorSubject, filter, map, Observable, pairwise, Unsubscribable } from 'rxjs';

import { Scope } from '@grafana/data';
import { ScopesContextValue, useScopes } from '@grafana/runtime';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneComponentProps, SceneObjectUrlValues, SceneObjectWithUrlSync } from './types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

export class SceneScopesBridge extends SceneObjectBase implements SceneObjectWithUrlSync {
  static Component = SceneScopesBridgeRenderer;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['scopes'] });

  protected _renderBeforeActivation = true;

  private _contextSubject = new BehaviorSubject<ScopesContextValue | undefined>(undefined);

  // Needed to maintain scopes values received from URL until the context is available
  private _pendingScopes: string[] | null = null;

  public getUrlState(): SceneObjectUrlValues {
    return {
      scopes: this._pendingScopes ?? (this.context?.state.value ?? []).map((scope: Scope) => scope.metadata.name),
    };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    let scopes = values['scopes'] ?? [];
    scopes = (Array.isArray(scopes) ? scopes : [scopes]).map(String);

    if (!this.context) {
      this._pendingScopes = scopes;
      return;
    }

    if (scopes.length) {
      this.context?.changeScopes(scopes);
    }
  }

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
    if (this._pendingScopes && newContext) {
      /**
       * The setTimeout here is needed to avoid a potential race condition in the URL sync handler
       * One way to test this is:
       * - navigate to a dashboard and select some scopes
       * - navigate to a suggested dashboard and change the selected scopes
       * - observe the URL not containing any scopes
       */
      setTimeout(() => {
        newContext?.changeScopes(this._pendingScopes!);
        this._pendingScopes = null;
      });

      /**
       * If we return here and don't allow the context to be propagated, scopes will never get activated when
       * navigating from a page without scopes to a page that has scopes.
       *
       * This is happening because the app will try to call `enable` on the context, but the context would not be available yet
       */
    }

    if (this.context !== newContext || this.context?.state !== newContext?.state) {
      // Checking if we should trigger a re-render before pushing new value for the context
      // Doing it here because otherwise the check would not be valid (this.context would be newContext due to the value push)
      const shouldUpdate = this.context?.state.value !== newContext?.state.value;

      this._contextSubject.next(newContext);

      /**
       * Whenever we got a new set of scopes, we force a re-render in order to trigger the URL sync handler
       * Without this, the URL would never be updated when the scopes change
       * TODO: This is a workaround and should be removed once we have a better way to handle this (aka trigger URL sync handler on demand)
       */
      if (shouldUpdate) {
        this.forceRender();
      }
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
