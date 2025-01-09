import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';
import React, { useState } from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { SelectableValue } from '@grafana/data';
import { graphWithGrapdientColor, plainGraph, timeSeriesBars } from './visualizations';
import { VizConfig } from '@grafana/scenes';
import { DemoVizLayout } from './utils';
import { DemoSubTitle } from '../pages/DemoSubTitle';

export function DynamicVisualiationPage() {
  const [selectedViz, setSelectedViz] = useState<VizConfig>(plainGraph);
  const selectedValue = visualizationOptions.find((x) => x.value === selectedViz)!;

  const dataProvider = useQueryRunner({
    queries: randomWalkQuery,
    maxDataPoints: 50,
    datasource: DATASOURCE_REF,
    cacheKey: randomWalkQuery,
  });

  const vizSelector = (
    <RadioButtonGroup value={selectedViz} options={visualizationOptions} onChange={setSelectedViz} size="sm" />
  );

  return (
    <PageWrapper
      title="Dynamic visualisation"
      subTitle={
        <DemoSubTitle
          text={'Rebuild queries based on some user input / state'}
          getSourceCodeModule={() => import('!!raw-loader!./DynamicVisualizationPage')}
        />
      }
    >
      <Stack direction="column">
        <DemoVizLayout>
          <VizPanel
            title={selectedValue.label!}
            dataProvider={dataProvider}
            viz={selectedViz}
            headerActions={vizSelector}
          />
        </DemoVizLayout>
      </Stack>
    </PageWrapper>
  );
}

const visualizationOptions: Array<SelectableValue<VizConfig>> = [
  { label: 'Graph', value: plainGraph },
  { label: 'Bars', value: timeSeriesBars },
  { label: 'Gradient graph', value: graphWithGrapdientColor },
];

const randomWalkQuery = [
  {
    refId: 'A',
    scenarioId: 'random_walk',
    alias: 'env = $env',
  },
];
