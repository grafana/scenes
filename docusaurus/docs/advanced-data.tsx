import React from 'react';
import {
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  EmbeddedScene,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneControlsSpacer,
} from '@grafana/scenes';

export function getAdvancedDataScene() {
  const data = new SceneQueryRunner({
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

  const scene = new EmbeddedScene({
    $data: data,
    controls: [new SceneControlsSpacer(), new SceneTimePicker({}), new SceneRefreshPicker({})],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: new CustomObject(),
        }),
      ],
    }),
  });

  return scene;
}

interface CustomObjectState extends SceneObjectState {}

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

function CustomObjectRenderer({ model }: SceneComponentProps<CustomObject>) {
  const data = sceneGraph.getData(model).useState();

  return (
    <div>
      <pre>Time range: {JSON.stringify(data.data?.timeRange)}</pre>
      <pre>Data: {JSON.stringify(data.data?.series)}</pre>
    </div>
  );
}
