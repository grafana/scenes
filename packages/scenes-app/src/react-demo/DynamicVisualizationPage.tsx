import { useSceneQuery, VizPanel } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';
import React, { useState } from 'react';
import { DATASOURCE_REF } from '../constants';
import { PageWrapper } from './PageWrapper';
import { SelectableValue } from '@grafana/data';
import { graphWithGrapdientColor, plainGraph, timeSeriesBars } from './visualizations';
import { VisualizationConfig } from '@grafana/scenes';
import { DemoVizLayout } from './utils';

export function DynamicVisualiationPage() {
  const [selectedViz, setSelectedViz] = useState<VisualizationConfig>(plainGraph);
  const selectedValue = visualizationOptions.find((x) => x.value === selectedViz)!;

  const dataProvider = useSceneQuery({ queries: randomWalkQuery, maxDataPoints: 50, datasource: DATASOURCE_REF });

  const vizSelector = (
    <RadioButtonGroup value={selectedViz} options={visualizationOptions} onChange={setSelectedViz} size="sm" />
  );

  return (
    <PageWrapper title="Dynamic visualisation" subTitle="Rebuild queries based on some user input / state">
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

const visualizationOptions: Array<SelectableValue<VisualizationConfig>> = [
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
