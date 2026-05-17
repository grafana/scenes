---
id: advanced-data
title: Data and time range in custom scene objects
---

Custom scene objects can use data and time range information added to a scene to perform additional operations. This topic describes how to use these properties in renderers and custom object classes.

To learn more about data and time range configuration, refer to [Data and time range](./core-concepts#data-and-time-range) first.

## Use data

In custom scene object use `sceneGraph.getData(model)` call to find and subscribe to the closest parent that has a `SceneDataProvider`. This means it uses `$data` set on its own level or shares data with other siblings and scene objects if `$data` is set on any parent level.

### Use data in a renderer

In your custom scene object renderer, you can subscribe to the closest `SceneDataProvider` by using the `sceneGraph.getData` utility:

```ts
import { sceneGraph, SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';

interface CustomObjectState extends SceneObjectState {}

class CustomObject extends SceneObjectBase<CustomObjectState> {
  static Component = CustomObjectRenderer;
}

function CustomObjectRenderer({ model }: SceneComponentProps<CustomObject>) {
  const data = sceneGraph.getData(model).useState();

  return (
    <div>
      <pre>Time range: {JSON.stringify(data.data?.timeRange)}</pre>
      <pre>Data: {JSON.stringify(data.data?.series)}</pre>
    </div>
  );
}
```

### Use data in a custom object class

You can also use data in your custom object class. To do so, use an [activation handler](./advanced-activation-handlers.md). In the activation handler, get the closest `SceneDataProvider` using `sceneGraph.getData(this)`. Then, subscribe to `SceneDataProvider` state changes using the `subscribeToState` method of the `SceneObjectBase`:

```ts
class CustomObject extends SceneObjectBase<CustomObjectState> {
  static Component = CustomObjectRenderer;

  constructor() {
    super({});
    this.addActivationHandler(() => this.activationHandler());
  }

  private activationHandler() {
    const sourceData = sceneGraph.getData(this);

    this._subs.add(sourceData.subscribeToState((state) => console.log(state)));
  }
}
```

:::note
The subscription returned from `sourceData.subscribeToState` is added to `this._subs`. Because of this, you don't need to do any cleanup when the custom object is destroyed, as the library will take care of unsubscribing.
:::

## Custom HTML or non-VizPanel views

`SceneQueryRunner` is a **`SceneDataProvider`**: it is not tied to Grafana’s chart panels (`VizPanel`). To build tables, KPIs, or plain HTML/CSS from query results:

1. Place a `SceneQueryRunner` on an ancestor (`$data` on `EmbeddedScene` or a layout item), or attach `$data` to the same branch as your custom object.
2. In your renderer, call **`sceneGraph.getData(model).useState()`** (or `subscribeToState` / [`getResultsStream()`](#subscribe-outside-react-with-getresultsstream) for non-hook code).
3. Read **`panelData`** from `@grafana/data`’s **`PanelData`** shape: **`series`** (data frames), **`annotations`**, **`state`** (`LoadingState` from **`@grafana/data`**), **`errors`**.

### Loading state and incremental updates

The runner uses Grafana’s **`runRequest`**. That API pushes **updates over time**, not only one final object. Expect:

- **`LoadingState.Loading`**—including while variables are still resolving—and sometimes **multiple** emissions before **`LoadingState.Done`**.
- **`LoadingState.Done`** when the datasource finished successfully.
- **`LoadingState.Error`** (or **`errors`** on the payload) on failure.

Your UI should treat **`panelData` as reactive stream state**: show spinners/skeletons on **`Loading`**, render frames on **`Done`**, surface **`errors`** on failure.

Example pattern:

```tsx
import { LoadingState } from '@grafana/data';

function TableFromQueryRenderer({ model }: SceneComponentProps<CustomObject>) {
  const providerState = sceneGraph.getData(model).useState();
  const panelData = providerState.data;

  if (!panelData || panelData.state === LoadingState.Loading) {
    return <div>Loading…</div>;
  }

  if (panelData.state === LoadingState.Error && panelData.errors?.length) {
    return (
      <div role="alert">
        {panelData.errors.map((e, i) => (
          <p key={i}>{e.message}</p>
        ))}
      </div>
    );
  }

  return (
    <table className="my-html-table">
      <tbody>
        {panelData.series.map((frame, idx) => (
          <tr key={idx}>
            <td>{frame.name ?? frame.refId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Adapt row/cell extraction to your datasource (inspect `frame.fields` or use **`DataFrameView`** when you need typed rows).

## `SceneQueryRunner` options relevant to custom views

These `SceneQueryRunner` state fields affect **when** and **how** queries run—affecting what your HTML panel observes:

| Option | Purpose |
| ------ | ------- |
| **`runQueriesMode`** | **`'auto'`** (default) runs on activate, time range changes, and when variable dependencies settle. **`'manual'`** skips that—call **`runQueries()`** yourself (tests or special workflows). |
| **`maxDataPointsFromWidth`** | When **`true`**, Grafana picks **`maxDataPoints`** from the panel container width—you must **`setContainerWidth(px)`** on the runner when your layout settles (typically from the render path measuring the wrapper). Without width, queries may defer until known. |
| **`isInViewChanged` / `bypassIsInViewChanged`** | Used with lazy rendering: runners can **defer** executing until visible; call **`isInViewChanged(true)`** when scrolled into view. |

For variable loading and cascading dependencies (why queries briefly stay in **`Loading`** without issuing a datasource call), see [Waiting for variables](./advanced-variables#waiting-for-variables).

## Subscribe outside React with `getResultsStream`

For logic outside React (or imperative subscribers), **`SceneDataProvider.getResultsStream()`** returns an RxJS-compatible stream that replays **`{ origin, data }`** payloads (same **`PanelData`** as **`useState`**). Prefer **`sceneGraph.getData`** + **`subscribeToState`** for most scenes; **`getResultsStream`** is optional when integrating non-React code.

## Use time range

Similarly to data, you can use the closest time range in a custom scene object using `sceneGraph.getTimeRange(model)`. This method can be used both in the custom object class and the renderer, as described previously in the [Use data](#use-data) section.

## Sharing same data provide

If you need to share the same data provider between many different scene objects and cannot do it by placing the $data on a shared common ancestor you can use the `DataProviderSharer`. This is a data provider that can share/forward data from another data provider.

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-data.tsx)
