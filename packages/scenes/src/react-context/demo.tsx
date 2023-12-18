import React from 'react';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { PluginPage } from '@grafana/runtime';
import { DataViz, PrintTime, SceneContextProvider, SceneControls } from './poc';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';

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
          <DataViz query='ALERTS{server="$server"}' />

          <SceneContextProvider
            initialState={{
              $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
              $variables: getInnerVariables(),
            }}
          >
            <Box>
              <SceneControls />
              <PrintTime />
              <DataViz query='ALERTS{server="$server", pod="$pod"}' />
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
    ],
  });
}

function getInnerVariables() {
  return new SceneVariableSet({ variables: [] });
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid gray', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {children}
    </div>
  );
}
