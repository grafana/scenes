import React from 'react';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { PluginPage } from '@grafana/runtime';
import { PrintTime, SceneContextProvider, SceneControls } from './poc';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';
import { useTheme2 } from '@grafana/ui';
import { CustomVariable } from '../variables/variants/CustomVariable';
import { useSceneQuery } from './useSceneQuery';
import { RVizPanel } from './RVizPanel';

export function ReactContextDemo() {
  return (
    <PluginPage>
      <SceneContextProvider
        initialState={{
          $timeRange: new SceneTimeRange({ from: 'now-10m', to: 'now' }),
          $variables: getOuterVariables(),
        }}
      >
        <Box>
          <SceneControls />
          <PrintTime />
          <DataViz title="10 points" maxDataPoints={10} />

          <SceneContextProvider
            initialState={{
              $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
              $variables: getInnerVariables(),
            }}
          >
            <Box>
              <SceneControls />
              <PrintTime />
              <DataViz title="50 points" maxDataPoints={50} />
            </Box>
          </SceneContextProvider>
        </Box>
      </SceneContextProvider>
    </PluginPage>
  );
}

function getOuterVariables() {
  return new SceneVariableSet({
    variables: [
      new TestVariable({ name: 'server', query: 'A.*', value: '', delayMs: 1000 }),
      new TestVariable({ name: 'pod', query: 'A.$server.*', value: '', delayMs: 1000 }),
      new CustomVariable({ name: 'count', query: '1,2,3,4,5', value: '1' }),
    ],
  });
}

function getInnerVariables() {
  return new SceneVariableSet({ variables: [] });
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
    <div style={{ width: '500px', height: '500px' }}>
      <RVizPanel title={props.title} dataProvider={dataProvider} />
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  const theme = useTheme2();
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border.weak}`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {children}
    </div>
  );
}
