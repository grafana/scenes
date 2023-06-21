import React from 'react';
import {
  EmbeddedScene,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
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

export function getAdvancedCustomObjectScene() {
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
