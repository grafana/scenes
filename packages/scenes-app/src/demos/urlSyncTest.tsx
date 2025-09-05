import React from 'react';
import {
  CustomVariable,
  EmbeddedScene,
  NestedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';
import { Button, Stack } from '@grafana/ui';
import { NewSceneObjectAddedEvent } from '@grafana/scenes/src/core/events';

export function getUrlSyncTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
    $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }),
    tabs: [
      new SceneAppPage({
        title: 'First',
        url: `${defaults.url}/first`,
        routePath: 'first',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [new CustomVariable({ name: 'env', query: 'test, dev, prod' })],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.timeseries().setTitle('Fill height').build(),
                }),
                new SceneFlexItem({
                  body: new DynamicSubScene({}),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Second',
        url: `${defaults.url}/manual`,
        routePath: 'manual',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [new CustomVariable({ name: 'env', query: 'test, dev, prod' })],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.timeseries().setTitle('Fill height').build(),
                }),
              ],
            }),
          });
        },
      }),
    ],
  });
}

interface DynamicSubSceneState extends SceneObjectState {
  scene?: SceneObject;
}

class DynamicSubScene extends SceneObjectBase<DynamicSubSceneState> {
  public constructor(state: DynamicSubSceneState) {
    super(state);

    this.addActivationHandler(() => {
      this.addScene();
    });
  }

  public onToggle = () => {
    if (this.state.scene) {
      this.setState({ scene: undefined });
      return;
    }

    this.addScene();
  };

  private addScene() {
    const scene = buildNewSubScene();
    this.publishEvent(new NewSceneObjectAddedEvent(scene), true);
    this.setState({ scene });
  }

  static Component = ({ model }: SceneComponentProps<DynamicSubScene>) => {
    const { scene } = model.useState();

    return (
      <Stack direction={'column'} flex="1">
        <Button variant="secondary" onClick={model.onToggle}>
          Toggle sub view
        </Button>
        {scene && <scene.Component model={scene} />}
      </Stack>
    );
  };
}

/**
 * Important for this test that this sub scene is created a new every time.
 * To make sure the url sync handler can handle the new instances without incrementing the unique url key.
 */
function buildNewSubScene() {
  return new NestedScene({
    controls: [
      new SceneControlsSpacer(),
      new VariableValueSelectors({}),
      new SceneTimePicker({}),
      new SceneRefreshPicker({}),
    ],
    $timeRange: new SceneTimeRange(),
    $variables: new SceneVariableSet({
      variables: [new CustomVariable({ name: 'env', query: 'test, dev, prod', label: 'env (local scene override)' })],
    }),
    $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }),
    title: 'Nested scene added on parent activation',
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries().setTitle('Fill height').build(),
        }),
      ],
    }),
  });
}
