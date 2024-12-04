import { Context } from 'react';
import { ReactContextsHandler, ReactContextsHandlerEntry, SceneObject } from './types';
import { BehaviorSubject, filter, map, pairwise, Unsubscribable } from 'rxjs';

export class ReactContexts implements ReactContextsHandler {
  private _ctxMap: BehaviorSubject<WeakMap<Context<any>, any>>;

  public constructor(public _sceneObject: SceneObject, public _contexts: ReactContextsHandlerEntry[]) {
    this._ctxMap = new BehaviorSubject(new WeakMap<Context<any>, any>());
  }

  public getContextsList(): ReactContextsHandlerEntry[] {
    return this._contexts;
  }

  public getContext<T = any>(ctx: Context<T>): T | undefined {
    return this._ctxMap.getValue().get(ctx);
  }

  public subscribeToContext<T = any>(ctx: Context<T>, cb: { (newCtxValue: T, prevCtxValue: T): void }): Unsubscribable {
    return this._ctxMap
      .pipe(
        pairwise(),
        filter(([prevCtxMap, newCtxMap]) => prevCtxMap.get(ctx) !== newCtxMap.get(ctx)),
        map(([prevCtxMap, newCtxMap]) => [newCtxMap.get(ctx), prevCtxMap.get(ctx)])
      )
      .subscribe(([newValue, prevValue]) => {
        cb(newValue, prevValue);
      });
  }

  public useContext<T = any>(ctx: Context<T>): T {
    return this._ctxMap.getValue().get(ctx);
  }

  public updateContext<T = any>(ctx: Context<T>, ctxValue: T) {
    const currentCtxMap = this._ctxMap.getValue();

    if (currentCtxMap.get(ctx) !== ctxValue) {
      const newCtxMap = this._contexts.reduce((acc, ctxEntry) => {
        acc.set(ctxEntry.context, ctxEntry.context === ctx ? ctxValue : currentCtxMap.get(ctxEntry.context));

        return acc;
      }, new WeakMap<Context<any>, any>());

      this._ctxMap.next(newCtxMap);
      this._sceneObject.forceRender();
    }
  }
}
