import {
  RVariableSelect,
  RCustomVariable,
  useSceneQuery,
  useVariableInterpolator,
  SceneDataNode,
  RVizPanel,
} from '@grafana/scenes';
import { Stack } from '@grafana/ui';
import React from 'react';

import { PageWrapper } from './PageWrapper';
import { getFrameDisplayName } from '@grafana/data';
import { plainGraph } from './visualizations';

export function RepeatBySeriesPage() {
  return (
    <PageWrapper title="Repeat by series" subTitle="Repeats visualizations returned by a single query">
      <RCustomVariable name="series" label="Series count" query="1,2,5,10,20,30" initialValue={'3'}>
        <Stack direction={'column'}>
          <RVariableSelect name="series" />
          <RepeatPanelBySeries />
        </Stack>
      </RCustomVariable>
    </PageWrapper>
  );
}

const RepeatPanelBySeries = React.memo(() => {
  const interpolator = useVariableInterpolator({ variables: ['series'] });
  const seriesCount = parseInt(interpolator('$series'), 10);

  const dataProvider = useSceneQuery({
    queries: [
      {
        uid: 'gdev-testdata',
        refId: 'A',
        scenarioId: 'random_walk',
        alias: '__server_names',
        seriesCount: seriesCount,
      },
    ],
    maxDataPoints: 50,
  });

  const { data } = dataProvider.useState();

  if (!data) {
    return null;
  }

  return (
    <Stack direction="row" wrap={'wrap'} gap={2}>
      {data.series.map((frame, index) => {
        const seriesName = getFrameDisplayName(frame, index);
        const dataNode = new SceneDataNode({
          data: {
            ...data,
            series: [frame],
          },
        });

        return (
          <div key={seriesName} style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
            <RVizPanel title={seriesName} viz={plainGraph} dataProvider={dataNode} />
          </div>
        );
      })}
    </Stack>
  );
});

RepeatPanelBySeries.displayName = 'RepeatPanelBySeries';
