import { lastValueFrom } from 'rxjs';

import { DataSourceApi, MetricFindValue } from '@grafana/data';
import { waitFor } from '@testing-library/react';

import { EmbeddedScene } from '../../../components/EmbeddedScene';
import { SceneCanvasText } from '../../../components/SceneCanvasText';
import { SceneTimeRange } from '../../../core/SceneTimeRange';
import { sceneGraph } from '../../../core/sceneGraph';
import { SceneObject } from '../../../core/types';
import { activateFullSceneTree } from '../../../utils/test/activateFullSceneTree';
import { SceneVariableSet } from '../../sets/SceneVariableSet';
import { CustomVariable } from '../CustomVariable';

import { QueryVariable } from './QueryVariable';

interface MetricFindQueryCall {
  variableName: string;
  interpolated: string;
}

const metricFindQueryCalls: MetricFindQueryCall[] = [];

function getGlobalSceneContext(): SceneObject | undefined {
  return (window as unknown as { __grafanaSceneContext?: SceneObject }).__grafanaSceneContext;
}

function setGlobalSceneContext(scene: SceneObject | undefined) {
  (window as unknown as { __grafanaSceneContext?: SceneObject }).__grafanaSceneContext = scene;
}

/**
 * Stands in for a datasource with legacy variable support (Graphite, Snowflake): it has no
 * `variables` property, and it interpolates through the global scene context instead of the
 * scopedVars it is handed, which is what templateSrv.replace() falls back to.
 */
const legacyDsMock = {
  name: 'legacy',
  type: 'legacy',
  uid: 'legacy',
  id: 1,
  getRef: () => ({ type: 'legacy', uid: 'legacy' }),
  query: () => Promise.resolve({ data: [] }),
  testDatasource: () => Promise.resolve({ status: 'success', message: '' }),
  async metricFindQuery(query: string, options: { variable: { name: string } }): Promise<MetricFindValue[]> {
    const sceneContext = getGlobalSceneContext();
    const interpolated = sceneContext ? sceneGraph.interpolate(sceneContext, query) : query;

    metricFindQueryCalls.push({ variableName: options.variable.name, interpolated });

    // Legacy datasources reach the network after interpolating, which is where a competing scene
    // would get the chance to take over the global context.
    await Promise.resolve();

    return [{ text: interpolated }];
  },
} as unknown as DataSourceApi;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    get: (): Promise<DataSourceApi> => Promise.resolve(legacyDsMock),
  }),
}));

function buildScene(environment: string, variableName: string) {
  const queryVariable = new QueryVariable({
    name: variableName,
    query: '$env.*',
    datasource: { uid: 'legacy', type: 'legacy' },
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
    $variables: new SceneVariableSet({
      variables: [
        new CustomVariable({ name: 'env', query: environment, value: environment, text: environment }),
        queryVariable,
      ],
    }),
    body: new SceneCanvasText({ text: environment }),
  });

  return { scene, queryVariable };
}

describe('LegacyQueryRunner', () => {
  beforeEach(() => {
    metricFindQueryCalls.length = 0;
    setGlobalSceneContext(undefined);
  });

  it('interpolates the query against the variable own scene, not whichever scene owns the global context', async () => {
    const first = buildScene('prod', 'hostsA');
    const second = buildScene('dev', 'hostsB');

    // Activating both leaves the second scene owning the global context, the way a report editor
    // holding one scene per dashboard does.
    activateFullSceneTree(first.scene);
    activateFullSceneTree(second.scene);

    expect(getGlobalSceneContext()).toBe(second.scene);

    // Resolved concurrently: both queries are in flight at the same time.
    await Promise.all([
      lastValueFrom(first.queryVariable.validateAndUpdate()),
      lastValueFrom(second.queryVariable.validateAndUpdate()),
    ]);

    expect(metricFindQueryCalls).toEqual(
      expect.arrayContaining([
        { variableName: 'hostsA', interpolated: 'prod.*' },
        { variableName: 'hostsB', interpolated: 'dev.*' },
      ])
    );
    expect(first.queryVariable.state.options).toEqual([{ label: 'prod.*', value: 'prod.*' }]);
    expect(second.queryVariable.state.options).toEqual([{ label: 'dev.*', value: 'dev.*' }]);
  });

  it('restores the global scene context after the query', async () => {
    const { scene, queryVariable } = buildScene('prod', 'hosts');

    activateFullSceneTree(scene);

    await lastValueFrom(queryVariable.validateAndUpdate());

    expect(getGlobalSceneContext()).toBe(scene);
  });

  it('interpolates through the global scene context when the datasource ignores scopedVars', async () => {
    const { scene, queryVariable } = buildScene('prod', 'hosts');

    // Activation runs the query on its own, so nothing else may trigger a refresh here: the
    // assertion below pins the exact calls the datasource saw.
    activateFullSceneTree(scene);

    await waitFor(() => expect(queryVariable.state.options).toEqual([{ label: 'prod.*', value: 'prod.*' }]));

    expect(metricFindQueryCalls).toEqual([{ variableName: 'hosts', interpolated: 'prod.*' }]);
  });
});
