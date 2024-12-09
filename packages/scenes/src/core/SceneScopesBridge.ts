import { isEqual } from 'lodash';
import { useEffect } from 'react';
import { BehaviorSubject, filter, map, Observable, pairwise, Unsubscribable } from 'rxjs';

import { Scope } from '@grafana/data';
// @ts-expect-error: TODO: Fix this once new runtime package is released
import { ScopesContextValue, useScopes } from '@grafana/runtime';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneComponentProps, SceneObjectUrlValues, SceneObjectWithUrlSync } from './types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

export class SceneScopesBridge extends SceneObjectBase implements SceneObjectWithUrlSync {
  static Component = SceneScopesBridgeRenderer;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['scopes'] });

  protected _renderBeforeActivation = true;

  private _contextSubject = new BehaviorSubject<ScopesContextValue | undefined>(undefined);

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

    this.context?.changeScopes(scopes);
  }

  public getValue(): Scope[] {
    return this.context?.state.value ?? [];
  }

  public subscribeToValue(cb: (newScopes: Scope[], prevScopes: Scope[]) => void): Unsubscribable {
    return this.contextObservable
      .pipe(
        filter((context) => !!context && !context.state.loading),
        pairwise(),
        map(
          ([prevContext, newContext]) =>
            [prevContext?.state.value ?? [], newContext?.state.value ?? []] as [Scope[], Scope[]]
        ),
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

  public updateContext(newContext: ScopesContextValue | undefined) {
    if (this._pendingScopes && newContext) {
      setTimeout(() => {
        newContext?.changeScopes(this._pendingScopes!);
        this._pendingScopes = null;
      });
    }

    if (this.context !== newContext || this.context?.state !== newContext?.state) {
      const shouldUpdate = this.context?.state.value !== newContext?.state.value;

      this._contextSubject.next(newContext);

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
