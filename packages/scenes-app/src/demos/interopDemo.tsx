import {
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
import { EmbeddedSceneWithContext, useTimeRange } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import { DemoVizLayout } from '../react-demo/utils';
import { PlainGraphWithRandomWalk } from '../react-demo/PlainGraphWithRandomWalk';

export function getInteropDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedSceneWithContext({
        ...getEmbeddedSceneDefaults(),
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
  static Component = CustomSceneObjectRenderer;
}

function CustomSceneObjectRenderer({ model }: SceneComponentProps<CustomSceneObject>) {
  const [timeRange, _] = useTimeRange();

  return (
    <Stack direction="column">
      <div>Time hook: {timeRange.from.toString()}</div>
      <DemoVizLayout>
        <PlainGraphWithRandomWalk title="Visualization using React VizPanel with data from useQueryRunner" />
      </DemoVizLayout>
    </Stack>
  );
}
