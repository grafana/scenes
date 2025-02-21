import {
  VariableControl,
  CustomVariable,
  useQueryRunner,
  useVariableInterpolator,
  VizPanel,
} from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';
import React from 'react';

import { PageWrapper } from './PageWrapper';
import { getFrameDisplayName } from '@grafana/data';
import { plainGraph } from './visualizations';
import { DemoVizLayout } from './utils';
import { SceneDataNode } from '@grafana/scenes';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function RepeatBySeriesPage() {
  return (
    <PageWrapper
      title="Repeat by series"
      subTitle={
        <DemoSubTitle
          text={'Repeats visualizations returned by a single query'}
          getSourceCodeModule={() => import('!!raw-loader!./RepeatBySeriesPage')}
        />
      }
    >
      <CustomVariable name="series" label="Series count" query="1,2,5,10,20,30" initialValue={'3'}>
        <Stack direction={'column'}>
          <VariableControl name="series" />
          <RepeatPanelBySeries />
        </Stack>
      </CustomVariable>
    </PageWrapper>
  );
}

const RepeatPanelBySeries = React.memo(() => {
  const interpolator = useVariableInterpolator({ variables: ['series'] });
  const seriesCount = parseInt(interpolator('$series'), 10);

  const dataProvider = useQueryRunner({
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
    <DemoVizLayout>
      {data.series.map((frame, index) => {
        const seriesName = getFrameDisplayName(frame, index);
        const dataNode = new SceneDataNode({
          data: {
            ...data,
            series: [frame],
          },
        });

        return <VizPanel key={seriesName} title={seriesName} viz={plainGraph} dataProvider={dataNode} />;
      })}
    </DemoVizLayout>
  );
});

RepeatPanelBySeries.displayName = 'RepeatPanelBySeries';
