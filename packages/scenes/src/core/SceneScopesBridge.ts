import { isEqual } from 'lodash';
import { useEffect } from 'react';
import { BehaviorSubject, filter, map, Observable, pairwise, Unsubscribable } from 'rxjs';

import { Scope } from '@grafana/data';

import { SceneObjectBase } from './SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from './types';
import { ScopesContextValue, useScopes } from './ScopesContext';

export interface SceneScopesBridgeState extends SceneObjectState {}

export class SceneScopesBridge extends SceneObjectBase<SceneScopesBridgeState> {
  static Component = SceneScopesBridgeRenderer;

  protected _renderBeforeActivation = true;

  private _contextSubject = new BehaviorSubject<ScopesContextValue | undefined>(undefined);

  public constructor(state: SceneScopesBridgeState) {
    super(state);
  }

  public getValue(): Scope[] {
    return this.context?.state.value ?? [];
  }

  public subscribeToValue(cb: (newScopes: Scope[], prevScopes: Scope[]) => void): Unsubscribable {
    return this.contextObservable
      .pipe(
        filter((context) => !!context && !context.state.isLoading),
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

  public getIsLoading(): boolean {
    return this.context?.state.isLoading ?? false;
  }

  public subscribeToIsLoading(cb: (isLoading: boolean) => void): Unsubscribable {
    return this.contextObservable
      .pipe(
        filter((context) => !!context),
        pairwise(),
        map(
          ([prevContext, newContext]) =>
            [prevContext?.state.isLoading ?? false, newContext?.state.isLoading ?? false] as [boolean, boolean]
        ),
        filter(([prevIsLoading, newIsLoading]) => prevIsLoading !== newIsLoading)
      )
      .subscribe(([_prevIsLoading, newIsLoading]) => {
        cb(newIsLoading);
      });
  }

  public enable() {
    this.context?.enable();
  }

  public disable() {
    this.context?.disable();
  }

  public enterReadOnly() {
    this.context?.enterReadOnly();
  }

  public exitReadOnly() {
    this.context?.exitReadOnly();
  }

  public updateContext(newContext: ScopesContextValue | undefined) {
    if (this.context !== newContext) {
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
