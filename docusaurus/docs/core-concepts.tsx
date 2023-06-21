import React from 'react';
import {
  EmbeddedScene,
  SceneFlexLayout,
  SceneFlexItem,
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  SceneQueryRunner,
  SceneTimeRange,
  PanelBuilders,
} from '@grafana/scenes';

// 1. Create interface that describes state of the scene object
interface CounterState extends SceneObjectState {
  count: number;
}

export class Counter extends SceneObjectBase<CounterState> {
  public static Component = CounterRenderer;

  public constructor() {
    super({
      count: 0,
    });
  }

  public onIncrement = () => {
    this.setState({
      count: this.state.count + 1,
    });
  };
}

function CounterRenderer({ model }: SceneComponentProps<Counter>) {
  const { count } = model.useState();

  return (
    <div>
      <div>Counter: {count}</div>
      <button onClick={model.onIncrement}>Increase</button>
    </div>
  );
}

export function getCustomObjectScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: new Counter(),
        }),
      ],
    }),
  });
}

export function getDataAndTimeRangeScene() {
  // Scene data, used by Panel A
  const queryRunner1 = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  // Panel B data
  const queryRunner2 = new SceneQueryRunner({
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
    $data: queryRunner1,
    // Global time range. queryRunner1 will use this time range.
    $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: PanelBuilders.timeseries().setTitle('Panel using global time range').build(),
        }),
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: PanelBuilders.timeseries()
            .setTitle('Panel using local time range')
            // Time range defined on VizPanel object. queryRunner2 will use this time range.
            .setTimeRange(new SceneTimeRange({ from: 'now-6h', to: 'now' }))
            .setData(queryRunner2)
            .build(),
        }),
      ],
    }),
  });

  return scene;
}
