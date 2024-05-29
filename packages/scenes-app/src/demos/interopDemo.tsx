import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';
import React from 'react';
import { useTimeRange } from '@grafana/scenes-react';

export function getInteropDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Testing using the hooks and plain react components from normal scene',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        //        context: new SceneContextObject({}),
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Graph',
                pluginId: 'timeseries',
                $data: getQueryRunnerWithRandomWalkQuery({}),
              }),
            }),
            new SceneFlexItem({
              body: new CustomSceneObject({}),
            }),
          ],
        }),
      });
    },
  });
}

class CustomSceneObject extends SceneObjectBase<SceneObjectState> {
  static Component = ({ model }: SceneComponentProps<CustomSceneObject>) => {
    const [timeRange, _] = useTimeRange();

    return <div>Time hook: {timeRange.from.toString()}</div>;
  };
}
