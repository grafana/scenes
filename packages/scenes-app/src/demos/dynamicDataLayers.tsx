import { config } from '@grafana/runtime';
import {
  dataLayers,
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneDataLayerSet,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneRefreshPicker,
  SceneTimePicker,
  VizPanel,
} from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDynamicDataLayersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        controls: [
          new SceneDataLayerControls(),
          new CustomButtons({}),
          new SceneControlsSpacer(),
          new SceneTimePicker({}),
          new SceneRefreshPicker({}),
        ],
        key: 'Multiple annotations layers',
        $data: new SceneDataLayerSet({
          layers: [],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  body: new VizPanel({
                    title: 'Global annotations only',
                    pluginId: 'timeseries',
                  }),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}

interface CustomButtonsState extends SceneObjectState {}

class CustomButtons extends SceneObjectBase<CustomButtonsState> {
  public onAdd = () => {
    const parent = sceneGraph.getAncestor(this, EmbeddedScene);
    const layers = parent.state.$data as SceneDataLayerSet;
    const count = layers.state.layers.length + 1;

    const newAnnotationQuery = new dataLayers.AnnotationsDataLayer({
      name: 'Annotation query ' + count,
      query: {
        datasource: {
          type: 'testdata',
          uid: 'gdev-testdata',
        },
        enable: true,
        iconColor: config.theme2.visualization.palette[count],
        name: 'New annotation',
        target: {
          // @ts-ignore
          lines: Math.random() * 15,
          refId: 'Anno',
          scenarioId: 'annotations',
        },
      },
    });

    layers.setState({
      layers: [...layers.state.layers, newAnnotationQuery],
    });
  };

  public onRemove = () => {
    const parent = sceneGraph.getAncestor(this, EmbeddedScene);
    const dataLayers = parent.state.$data as SceneDataLayerSet;

    dataLayers.setState({ layers: dataLayers.state.layers.slice(0, -1) });
  };

  static Component = ({ model }: SceneComponentProps<CustomButtons>) => {
    return (
      <>
        <Button onClick={model.onAdd} variant="secondary">
          Add annotation layer
        </Button>
        <Button onClick={model.onRemove} variant="secondary">
          Remove annotation layer
        </Button>
      </>
    );
  };
}
