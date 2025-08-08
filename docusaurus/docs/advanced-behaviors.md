---
id: advanced-behaviors
title: Behaviors
---

With behaviors you can implement custom scene logic that will be performed as a side effect. Behaviors are useful for performing side effects like conditionally hiding elements on a scene or attaching shared functionalities across scene objects.

## Defining a behavior

Behaviors can be implemented in two ways:

- As a pure function that gets called when its parent is activated.
- As a scene object that is activated when its parent is activated.

Behaviors can be attached to scene objects using `$behaviors` state property. For example, you can attach behaviors to a `SceneQueryRunner`:

```ts
const queryRunner = new SceneQueryRunner({
  $behaviors: [
    /* list of behaviors */
  ],

  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'A',
      range: true,
      format: 'time_series',
      expr: 'rate(prometheus_http_requests_total[5m])',
    },
  ],
});
```

### Behaviors as pure functions

Behaviors can be implemented as a stateless function that gets called when behavior parent is activated. This function can return a deactivation handler to be called when parent is deactivated.

Below you will find a simple stateless behavior that will log in the developer console when behavior's parent activates/deactivates or its state changes.

```ts
const StatelessLoggerBehavior = (parent: SceneObject) => {
  console.log(`${parent.state.key} activated`);

  parent.subscribeToState(() => {
    console.log(`${parent.state.key} state changed`);
  });

  return () => {
    console.log(`${parent.state.key} deactivated`);
  };
};
```

### Behaviors as scene objects

Implementing a behavior as a scene object is exactly the same as implementing a custom scene object. The example bellow illustrates an extended logger behavior from the previous example that will log in the developer console when a scene object activates/deactivates, and batch parent state updates logs based on provided configuration:

```tsx
interface StatefulLoggerBehaviorState extends SceneObjectState {
  // Size of the batch of state updates
  batchStateUpdates: number;
}

class StatefulLoggerBehavior extends SceneObjectBase<StatefulLoggerBehaviorState> {
  private _batchedStateUpdates: Array<SceneObjectState> = [];

  constructor(state: Partial<StatefulLoggerBehaviorState>) {
    super({
      batchStateUpdates: 5,
      ...state,
    });
    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const parent = this.parent;

    if (!parent) {
      throw new Error('LoggerBehavior must be attached to a parent object');
    }

    console.log(`StatefulLoggerBehavior: ${parent.state.key} activated`);

    parent.subscribeToState(() => {
      this._batchedStateUpdates.push(parent.state);

      if (this._batchedStateUpdates.length === this.state.batchStateUpdates) {
        console.log(`StatefulLoggerBehavior: ${parent.state.key} state changed batch`, this._batchedStateUpdates);
        this._batchedStateUpdates = [];
      }
    });

    return () => {
      console.log(`StatefulLoggerBehavior: ${parent.state.key} deactivated`);
    };
  };
}
```

## Built-in behaviors

Scenes library comes with the following, built-in behaviors:

### `ActWhenVariableChanged`

Performs a side effect when a variable changes.

#### Usage

Assuming there is a `MultiValueVariable` variable named `myVariable` in a scene, you can configure a side effect to be performed when the variable value changes:

```ts
import { behaviors, MultiValueVariable } from '@grafana/scenes';

const logWhenVariableChanges = new behaviors.ActWhenVariableChanged({
  variableName: 'myVariable',
  onChange: (variable) => {
    if (!(variable instanceof MultiValueVariable)) {
      throw new Error('Invalid variable type for ActWhenVariableChanged behavior');
    }
    console.log(`myVariable value changed: ${variable.state.value}`);
  },
});
```

### `CursorSync`

Creates a shared cursor scope for configuring cursor sync across multiple panels.

#### Usage

In the example below the `CursorSync` behavior is used to synchronise cursor across all panels in a scene:

```ts
import {
  behaviors,
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
} from '@grafana/scenes';

const httpRequests = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'A',
      range: true,
      format: 'time_series',
      expr: 'rate(prometheus_http_requests_total[5m])',
    },
  ],
});

const cpuUsage = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: 'gdev-prometheus',
  },
  queries: [
    {
      refId: 'A',
      expr: 'avg by (job, instance, mode) (rate(node_cpu_seconds_total[5m]))',
    },
  ],
});

const scene = new EmbeddedScene({
  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
  $behaviors: [new behaviors.CursorSync({ key: 'cursor-sync-scope', sync: DashboardCursorSync.Tooltip })],
  body: new SceneFlexLayout({
    direction: 'row',
    children: [
      new SceneFlexItem({
        width: '50%',
        height: 300,
        body: PanelBuilders.timeseries().setData(httpRequests).setTitle('HTTP Requests').build(),
      }),
      new SceneFlexItem({
        width: '50%',
        height: 300,
        body: PanelBuilders.timeseries()
          .setTitle('CPU Usage')
          .setTimeRange(new SceneTimeRange({ from: 'now-6h', to: 'now' }))
          .setData(cpuUsage)
          .build(),
      }),
    ],
  }),
});
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-behaviors.tsx)
