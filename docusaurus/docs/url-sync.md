---
id: url-sync
title: Url sync
---

Scenes comes with a URL sync system that enables two way syncing of scene object state to URL.

## UrlSyncContextProvider

To enable URL sync you have to wrap your root scene in a UrlSyncContextProvider

```tsx
<UrlSyncContextProvider scene={scene} updateUrlOnInit={true} createBrowserHistorySteps={true} />
```

## SceneApp

For scene apps that use SceenApp the url sync initialized for you, but you can still set url sync options on the SceneApp state.

```tsx
function getSceneApp() {
  return new SceneApp({
    pages: [],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}
```

## SceneObjectUrlSyncHandler

A scene objects that set's its `_urlSync` property will have the option to sync part of it's state to / from the URL.

This property has this interface type:

```tsx
export interface SceneObjectUrlSyncHandler {
  getKeys(): string[];
  getUrlState(): SceneObjectUrlValues;
  updateFromUrl(values: SceneObjectUrlValues): void;
  shouldCreateHistoryStep?(values: SceneObjectUrlValues): boolean;
}
```

The current behavior of updateFromUrl is a bit strange in that it will only pass on URL values that are different compared to what is returned by
getUrlState.

## Browser history

If createBrowserHistorySteps is enabled then for state changes where shouldCreateHistoryStep return true new browser history states will be returned.

## SceneObjectUrlSyncConfig

This class implements the SceneObjectUrlSyncHandler interface and is a utility class to make it a bit easier for scene objects to implement
url sync behavior.

Example:

```tsx
export class SomeObject extends SceneObjectBase<SomeObjectState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['from', 'to'] });

  public getUrlState() {
    return { from: this.state.from, to: this.state.to };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    const update: Partial<SomeObjectState> = {};

    if (typeof values.from === 'string') {
      update.from = values.from;
    }

    if (typeof values.to === 'string') {
      update.to = values.to;
    }

    this.setState(update);
  }

  onUserUpdate(from: string, to: string) {
    // For state actions that should add browser history wrap them in this callback
    this._urlSync.performBrowserHistoryAction(() => {
      this.setState({ from, to });
    });
  }
}
```
