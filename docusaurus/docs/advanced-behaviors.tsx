import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
} from '@grafana/scenes';

const StatelessLoggerBehavior = (parent: SceneObject) => {
  console.log(`${parent.state.key} activated`);

  parent.subscribeToState(() => {
    console.log(`${parent.state.key} state changed`);
  });

  return () => {
    console.log(`${parent.state.key} deactivated`);
  };
};

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

export function getAdvancedBehaviors() {
  const queryRunner = new SceneQueryRunner({
    $behaviors: [StatelessLoggerBehavior, new StatefulLoggerBehavior({ batchStateUpdates: 5 })],

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

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
    body: new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().setTitle('Panel title').setData(queryRunner).build(),
        }),
      ],
    }),
  });

  return scene;
}
