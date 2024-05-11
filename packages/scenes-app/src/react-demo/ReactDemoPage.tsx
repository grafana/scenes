import {
  SceneTimeRange,
  SceneVariableSet,
  CustomVariable,
  SceneContextProvider,
  useVariableValues,
  RVariableSelect,
} from '@grafana/scenes';
import { Stack, TextLink } from '@grafana/ui';
import React from 'react';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { Route, Switch } from 'react-router-dom';
import { DataViz } from './Components';
import { PageWrapper } from './PageWrapper';

export function ReactDemoPage() {
  return (
    <SceneContextProvider
      initialState={{
        $timeRange: new SceneTimeRange({ from: 'now-10m', to: 'now' }),
        $variables: getOuterVariables(),
      }}
    >
      <Switch>
        <Route path={prefixRoute(`${ROUTES.ReactDemo}`)} component={HomePage} exact />
        <Route path={prefixRoute(`${ROUTES.ReactDemo}/repeat-by-variable`)} component={RepeatByVariablePage} />
      </Switch>
    </SceneContextProvider>
  );
}

function HomePage() {
  return (
    <PageWrapper title="Home" subTitle="Welcome to the React first demos">
      <Stack direction={'column'} gap={2}>
        <DataViz title="Welcome" maxDataPoints={50} />
        <h2>Other demos</h2>
        <TextLink href={prefixRoute(`${ROUTES.ReactDemo}/repeat-by-variable`)}>Repeat by variable</TextLink>
      </Stack>
    </PageWrapper>
  );
}

function RepeatByVariablePage() {
  return (
    <PageWrapper
      title="Repeat by variable"
      subTitle="Has a nested variable scope with a new variable which we repeat some viz panels by"
    >
      <SceneContextProvider
        initialState={{
          $variables: getRepeatVariable(),
        }}
      >
        <Stack direction={'column'}>
          <RVariableSelect name="panels" />
          <RepeatPanelByVariable />
        </Stack>
      </SceneContextProvider>
    </PageWrapper>
  );
}

function RepeatPanelByVariable() {
  const [values, loading] = useVariableValues('panels');

  if (loading || !values) {
    return <div>Waiting for variable</div>;
  }

  return (
    <Stack direction="row" wrap={'wrap'} gap={2}>
      {(values as string[]).map((value: string) => (
        <DataViz key={value} title={`${value} data points`} maxDataPoints={parseInt(value, 10)} />
      ))}
    </Stack>
  );
}

function getOuterVariables() {
  return new SceneVariableSet({
    variables: [new CustomVariable({ name: 'env', query: 'dev, test, prod', value: 'dev' })],
  });
}

function getRepeatVariable() {
  return new SceneVariableSet({
    variables: [new CustomVariable({ name: 'panels', query: '10, 20, 30, 40, 50', value: ['10'], isMulti: true })],
  });
}
