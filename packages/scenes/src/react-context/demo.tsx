import React from 'react';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { PluginPage } from '@grafana/runtime';
import { SceneContextProvider, useTimeRange, useVariableValues } from './SceneContextProvider';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';
import { Stack, useTheme2 } from '@grafana/ui';
import { CustomVariable } from '../variables/variants/CustomVariable';
import { useSceneQuery } from './useSceneQuery';
import { RVizPanel } from './RVizPanel';
import { RTimeRangePicker } from './RTimeRangePicker';
import { RVariableSelect } from './RVariableSelect';

export function ReactContextDemo() {
  return (
    <PluginPage>
      <SceneContextProvider
        initialState={{
          $timeRange: new SceneTimeRange({ from: 'now-10m', to: 'now' }),
          $variables: getOuterVariables(),
        }}
      >
        <SceneControls />
        <PrintTime />
        <RepeatPanelByVariable />

        <SceneContextProvider
          initialState={{
            $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
            $variables: getInnerVariables(),
          }}
        >
          <Line />
          <SceneControls />
          <PrintTime />
          <DataViz title="50 points" maxDataPoints={50} />
        </SceneContextProvider>
      </SceneContextProvider>
    </PluginPage>
  );
}

function getOuterVariables() {
  return new SceneVariableSet({
    variables: [
      new TestVariable({ name: 'server', query: 'A.*', value: '', delayMs: 1000 }),
      new TestVariable({ name: 'pod', query: 'A.$server.*', value: '', delayMs: 1000 }),
      new CustomVariable({ name: 'panels', query: '10, 20, 30, 40, 50', value: ['10'], isMulti: true }),
    ],
  });
}

function getInnerVariables() {
  return new SceneVariableSet({ variables: [] });
}

function PrintTime() {
  const [time] = useTimeRange();
  return <div style={{ padding: '16px 0' }}>time: {time.raw.from}</div>;
}

function SceneControls() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
      <RVariableSelect name="server" />
      <RVariableSelect name="pod" />
      <RVariableSelect name="panels" />
      <RTimeRangePicker />
    </div>
  );
}

interface DataVizProps {
  maxDataPoints: number;
  title: string;
}

function DataViz(props: DataVizProps) {
  const dataProvider = useSceneQuery({
    queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: '$pod' }],
    maxDataPoints: props.maxDataPoints,
  });

  return (
    <div style={{ height: '300px', minWidth: '300px', flexGrow: 1 }}>
      <RVizPanel title={props.title} dataProvider={dataProvider} />
    </div>
  );
}

function Line() {
  const theme = useTheme2();
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border.weak}`,
        margin: '16px 0',
        display: 'flex',
        height: '1px',
        width: '100%',
      }}
    />
  );
}

function RepeatPanelByVariable() {
  const [values, loading] = useVariableValues('panels');

  if (loading || !values) {
    return <div>Waiting for variable</div>;
  }

  return (
    <Stack direction="row" wrap={'wrap'} gap={2}>
      {values.map((value: string) => (
        <DataViz key={value} title={`${value} data points`} maxDataPoints={parseInt(value, 10)} />
      ))}
    </Stack>
  );
}
