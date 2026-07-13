import { map, Observable, of, Subject } from 'rxjs';

// Mock crypto.randomUUID for generateOperationId
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-1234-5678-9abc-def012345678'),
  },
});

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  FieldType,
  LoadingState,
  PanelData,
  toDataFrame,
  toUtc,
  VariableRefresh,
} from '@grafana/data';

import { SceneTimeRange } from '../core/SceneTimeRange';

import { QueryRunnerState, SceneQueryRunner } from './SceneQueryRunner';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';
import { TestScene } from '../variables/TestScene';
import { RuntimeDataSource, registerRuntimeDataSource, runtimeDataSources } from './RuntimeDataSource';
import { DataQuery } from '@grafana/schema';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { SceneTimeRangeCompare } from '../components/SceneTimeRangeCompare';
import { SceneDataLayerSet } from './SceneDataLayerSet';
import { TestAlertStatesDataLayer, TestAnnotationsDataLayer } from './layers/TestDataLayer';
import { TestSceneWithRequestEnricher } from '../utils/test/TestSceneWithRequestEnricher';
import { AdHocFiltersVariable, GROUP_BY_OPERATOR } from '../variables/adhoc/AdHocFiltersVariable';
import { GroupByVariable } from '../variables/groupby/GroupByVariable';
import { emptyPanelData } from '../core/SceneDataNode';
import { SceneQueryController } from '../behaviors/SceneQueryController';
import { activateFullSceneTree } from '../utils/test/activateFullSceneTree';
import { SceneDataQuery, SceneDeactivationHandler, SceneObjectState } from '../core/types';
import { LocalValueVariable } from '../variables/variants/LocalValueVariable';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { ExtraQueryDataProcessor, ExtraQueryDescriptor, ExtraQueryProvider } from './ExtraQueryProvider';
import { SafeSerializableSceneObject } from '../utils/SafeSerializableSceneObject';
import { SceneQueryStateControllerState } from '../behaviors/types';
import { config } from '@grafana/runtime';
import { ScopesVariable } from '../variables/variants/ScopesVariable';
import { ConstantVariable } from '../variables/variants/ConstantVariable';
import { CustomVariable } from '../variables/variants/CustomVariable';

const getDataSourceMock = jest.fn().mockImplementation((datasource) => {
  const isMixed = datasource?.uid === '-- Mixed --';

  return {
    uid: isMixed ? '-- Mixed --' : 'test-uid',
    meta: isMixed ? { mixed: true } : undefined,
    getRef: () => (isMixed ? { type: 'mixed', uid: '-- Mixed --' } : { uid: 'test-uid' }),
    query: (request: DataQueryRequest) => {
      if (request.targets.find((t) => t.refId === 'withAnnotations')) {
        return of({
          data: [
            toDataFrame({
              refId: 'withAnnotations',
              datapoints: [
                [100, 1],
                [400, 2],
                [500, 3],
              ],
            }),
            toDataFrame({
              name: 'exemplar',
              refId: 'withAnnotations',
              meta: {
                typeVersion: [0, 0],
                custom: {
                  resultType: 'exemplar',
                },
                dataTopic: 'annotations',
              },
              fields: [
                {
                  name: 'foo',
                  type: 'string',
                  values: ['foo1', 'foo2', 'foo3'],
                },
                {
                  name: 'bar',
                  type: 'string',
                  values: ['bar1', 'bar2', 'bar3'],
                },
              ],
            }),
          ],
        });
      }

      // Secondary (extra) query routing used by the secondary-query merging tests.
      // Annotation-only secondary used to assert annotation concatenation.
      const firstRefId = request.targets[0]?.refId;
      if (firstRefId === 'secAnnotations') {
        return of({
          data: [
            toDataFrame({
              refId: 'secAnnotations',
              name: 'secondary annotation',
              meta: { dataTopic: 'annotations' },
              fields: [
                { name: 'time', type: FieldType.time, values: [1] },
                { name: 'text', type: FieldType.string, values: ['secondary annotation'] },
              ],
            }),
          ],
        });
      }
      // Any other secondary echoes its refId so series identity/order can be asserted.
      if (typeof firstRefId === 'string' && firstRefId.startsWith('sec')) {
        return of({
          data: [
            toDataFrame({
              refId: firstRefId,
              datapoints: [
                [10, 1],
                [20, 2],
              ],
            }),
          ],
        });
      }

      return of({
        data: [
          toDataFrame({
            refId: 'A',
            datapoints: [
              [100, 1],
              [200, 2],
              [300, 3],
            ],
          }),
        ],
      });
    },
  };
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = {
    state: LoadingState.Loading,
    series: [],
    annotations: [],
    request,
    timeRange: request.range,
  };

  return (ds.query(request) as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      result.state = LoadingState.Done;
      result.series = packet.data.filter((d) => d.meta?.dataTopic !== 'annotations');
      result.annotations = packet.data.filter((d) => d.meta?.dataTopic === 'annotations');
      return result;
    })
  );
});

let sentRequest: DataQueryRequest | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    sentRequest = request;
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return {
      get: getDataSourceMock,
      getInstanceSettings: () => ({ uid: 'test-uid' }),
    };
  },
  getTemplateSrv: () => ({
    getAdhocFilters: jest.fn(),
  }),
  config: {
    buildInfo: {
      version: '1.0.0',
    },
    theme: {
      palette: {
        gray60: '#666666',
      },
    },
  },
}));

// 11.1.2 - will use SafeSerializableSceneObject
// 11.1.1 - will NOT use SafeSerializableSceneObject
describe.each(['11.1.2', '11.1.1'])('SceneQueryRunner', (v) => {
  let deactivationHandlers: SceneDeactivationHandler[] = [];
  beforeEach(() => {
    config.buildInfo.version = v;
  });
  afterEach(() => {
    runRequestMock.mockClear();
    getDataSourceMock.mockClear();
    deactivationHandlers.forEach((h) => h());
    deactivationHandlers = [];
  });

  describe('when running query', () => {
    it('should build DataQueryRequest object', async () => {
      Date.now = jest.fn(() => 1689063488000);
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        cacheTimeout: '30',
        queryCachingTTL: 300000,
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest).toBeDefined();
      const { scopedVars, ...request } = sentRequest!;

      // Remove requestId from snapshot as it depends on test execution order
      request.requestId = 'test';

      expect(Object.keys(scopedVars)).toMatchInlineSnapshot(`
        [
          "__sceneObject",
          "__interval",
          "__interval_ms",
        ]
      `);
      expect(request).toMatchSnapshot();
    });

    it('should use requestIdPrefix when provided', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        requestIdPrefix: 'my-panel-',
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest).toBeDefined();
      expect(sentRequest!.requestId).toMatch(/^my-panel-\d+$/);
    });

    it('should use default SQR prefix when requestIdPrefix is not provided', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest).toBeDefined();
      expect(sentRequest!.requestId).toMatch(/^SQR\d+$/);
    });
  });

  describe('when result has annotations', () => {
    it('should not duplicate annotations when queried repeatedly', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'withAnnotations' }],
        $timeRange: new SceneTimeRange(),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      expect(queryRunner.state.data?.annotations).toHaveLength(1);

      queryRunner.runQueries();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      expect(queryRunner.state.data?.annotations).toHaveLength(1);
    });
  });

  describe("When parent get's scoped time range", () => {
    it('should subscribe to new local time', async () => {
      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }] });

      const scene = new TestScene({
        $timeRange: new SceneTimeRange(),
        nested: new TestScene({
          $data: queryRunner,
        }),
      });

      expect(queryRunner.state.data).toBeUndefined();
      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      const localTimeRange = new SceneTimeRange({ from: 'now-10m', to: 'now' });
      scene.state.nested?.setState({ $timeRange: localTimeRange });
      queryRunner.runQueries();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest?.range).toEqual(localTimeRange.state.value);

      localTimeRange.onTimeRangeChange({
        from: toUtc('2020-01-01'),
        to: toUtc('2020-01-02'),
        raw: { from: 'now-5m', to: 'now' },
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(sentRequest?.range.raw).toEqual({ from: 'now-5m', to: 'now' });
    });
  });

  describe('when runQueriesMode is set to manual', () => {
    it('should not run queries on activate', async () => {
      const queryRunner = new SceneQueryRunner({
        runQueriesMode: 'manual',
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();
    });

    it('should run queries when calling runQueries', async () => {
      const $timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        runQueriesMode: 'manual',
        queries: [{ refId: 'A' }],
        $timeRange,
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.runQueries();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(queryRunner.state.data?.series).toHaveLength(1);
    });

    it('should not subscribe to time range when calling runQueries', async () => {
      const $timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        runQueriesMode: 'manual',
        queries: [{ refId: 'A' }],
        $timeRange,
      });

      queryRunner.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();

      // Run the query manually
      queryRunner.runQueries();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(queryRunner.state.data?.series[0].refId).toBe('A');

      queryRunner.setState({
        queries: [{ refId: 'B' }],
        $timeRange,
      });

      $timeRange.onRefresh();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(1);
      expect(queryRunner.state.data?.series[0].refId).toBe('A');

      queryRunner.runQueries();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);
      expect(queryRunner.state.data?.request?.targets[0].refId).toBe('B');
    });

    it('should not run queries on timerange change', async () => {
      const $timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        runQueriesMode: 'manual',
        queries: [{ refId: 'A' }],
        $timeRange,
      });

      queryRunner.activate();
      $timeRange.onRefresh();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();
    });

    it('should not execute query on variable update', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        runQueriesMode: 'manual',
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data).toBeUndefined();

      variable.changeValueTo('AB');

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(0);
    });

    it('should not execute query on adhoc/groupby variable update', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
        runQueriesMode: 'manual',
      });

      const scene = new EmbeddedScene({ $data: queryRunner, body: new SceneCanvasText({ text: 'hello' }) });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [],
      });

      scene.setState({ $variables: new SceneVariableSet({ variables: [filtersVar] }) });
      deactivationHandlers.push(filtersVar.activate());

      filtersVar.setState({ filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }] });

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();
    });

    it('should not execute query on container width change if maxDataPointsFromWidth is not set', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        runQueriesMode: 'manual',
      });

      queryRunner.activate();
      queryRunner.setContainerWidth(100);

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data).toBeUndefined();
    });

    it('should execute query on container width change if maxDataPointsFromWidth is set', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        runQueriesMode: 'manual',
        maxDataPointsFromWidth: true,
      });

      queryRunner.activate();
      queryRunner.setContainerWidth(100);

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(queryRunner.state.data?.series).toHaveLength(1);
    });
  });

  describe('when activated and got no data', () => {
    it('should run queries', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      // Default max data points
      expect(sentRequest?.maxDataPoints).toBe(500);
    });

    it('should not use containerWidth by default', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      queryRunner.setContainerWidth(100);
      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should not use container width
      expect(sentRequest?.maxDataPoints).toBe(500);
    });

    it('should pass scene object via scoped vars when resolving datasource and running request', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(1).toBe(1);
      const getDataSourceCall = getDataSourceMock.mock.calls[0];
      const runRequestCall = runRequestMock.mock.calls[0];

      expect((runRequestCall[1].scopedVars.__sceneObject.value as SafeSerializableSceneObject).valueOf()).toBe(
        queryRunner
      );
      expect(runRequestCall[1].scopedVars.__sceneObject.text).toBe('__sceneObject');

      expect((getDataSourceCall[1].__sceneObject.value as SafeSerializableSceneObject).valueOf()).toBe(queryRunner);
      expect(getDataSourceCall[1].__sceneObject.text).toBe('__sceneObject');
    });

    it('should fan out a query + dependent expression across a multi-value datasource variable', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: '-- Mixed --' },
        queries: [
          { refId: 'A', datasource: { uid: '$ds' }, hide: true },
          { refId: 'B', datasource: { type: '__expr__', uid: '__expr__' }, type: 'math', expression: '$A' },
        ],
      });

      const dsVar = new CustomVariable({
        name: 'ds',
        query: 'ds1,ds2',
        isMulti: true,
        value: ['ds1', 'ds2'],
        text: ['ds1', 'ds2'],
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [dsVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const targets = runRequestMock.mock.calls[0][1].targets;
      // A + B fanned out once per selected datasource, with unique refIds
      expect(targets.map((t: DataQuery) => t.refId).sort()).toEqual(['A_0', 'A_1', 'B_0', 'B_1']);

      const byRefId = (refId: string) => targets.find((t: DataQuery) => t.refId === refId);
      // data-query clones pinned to concrete datasources
      expect(byRefId('A_0').datasource.uid).toBe('ds1');
      expect(byRefId('A_1').datasource.uid).toBe('ds2');
      // expression clones reference their own fanned-out data query
      expect(byRefId('B_0').expression).toBe('${A_0}');
      expect(byRefId('B_1').expression).toBe('${A_1}');
    });

    it('should pass adhoc filters via request object', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [filtersVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].filters).toEqual(filtersVar.state.filters);

      // Verify updating filter re-triggers query
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue' });

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].filters).toEqual(filtersVar.state.filters);
    });

    it('should pass adhoc origin filter via request object if they have a source defined', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
        originFilters: [{ key: 'C', operator: '=', value: 'D', condition: '', origin: 'scope' }],
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [filtersVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].filters).toEqual([...filtersVar.state.originFilters!, ...filtersVar.state.filters]);
    });

    it('only passes fully completed adhoc filters', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [
          {
            key: 'A',
            operator: '=',
            value: 'B',
            condition: '',
          },
          {
            key: 'C',
            operator: '=',
            value: '',
            condition: '',
          },
        ],
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [filtersVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].filters).toEqual([
        {
          key: 'A',
          operator: '=',
          value: 'B',
          condition: '',
        },
      ]);

      // Verify updating filter re-triggers query
      filtersVar._updateFilter(filtersVar.state.filters[1], { value: 'D' });

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].filters).toEqual([
        {
          key: 'A',
          operator: '=',
          value: 'B',
          condition: '',
        },
        {
          key: 'C',
          operator: '=',
          value: 'D',
          condition: '',
        },
      ]);
    });

    it('Adhoc filter added after first query', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const scene = new EmbeddedScene({ $data: queryRunner, body: new SceneCanvasText({ text: 'hello' }) });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [],
      });

      scene.setState({ $variables: new SceneVariableSet({ variables: [filtersVar] }) });
      deactivationHandlers.push(filtersVar.activate());

      filtersVar.setState({ filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }] });

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[1];
      expect(runRequestCall[1].filters).toEqual(filtersVar.state.filters);
    });

    it('should not add non-applicable filters from adhoc to query', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const scene = new EmbeddedScene({ $data: queryRunner, body: new SceneCanvasText({ text: 'hello' }) });

      const deactivate = activateFullSceneTree(scene);
      deactivationHandlers.push(deactivate);

      await new Promise((r) => setTimeout(r, 1));

      const filtersVar = new AdHocFiltersVariable({
        datasource: { uid: 'test-uid' },
        applyMode: 'auto',
        filters: [],
      });

      scene.setState({ $variables: new SceneVariableSet({ variables: [filtersVar] }) });
      deactivationHandlers.push(filtersVar.activate());

      await new Promise((r) => setTimeout(r, 1));

      filtersVar.setState({
        filters: [
          { key: 'A', operator: '=', value: 'B' },
          { key: 'C', operator: '=', value: 'D', nonApplicable: true },
        ],
      });

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[1];
      // drops the nonApplicable filter
      expect(runRequestCall[1].filters).toEqual([{ key: 'A', operator: '=', value: 'B' }]);
    });

    it('should pass group by dimensions via request object from AdHocFiltersVariable', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filtersVar = new AdHocFiltersVariable({
        name: 'filters',
        datasource: { uid: 'test-uid' },
        filters: [
          { key: 'A', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
          { key: 'B', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
        enableGroupBy: true,
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [filtersVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      deactivationHandlers.push(activateFullSceneTree(scene));

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].groupByKeys).toEqual(['A', 'B']);

      // Verify updating groupBy filters re-triggers query
      filtersVar.updateFilters([
        { key: 'C', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        { key: 'D', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
      ]);

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].groupByKeys).toEqual(['C', 'D']);
    });

    it('should not pass group by dimensions when enableGroupBy is false', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filtersVar = new AdHocFiltersVariable({
        name: 'filters',
        datasource: { uid: 'test-uid' },
        filters: [
          { key: 'host', operator: '=', value: 'web-1', condition: '' },
          { key: 'A', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
          { key: 'B', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
        enableGroupBy: false,
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [filtersVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      deactivationHandlers.push(activateFullSceneTree(scene));

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].groupByKeys).toBeUndefined();
      expect(runRequestCall[1].filters).toEqual([{ key: 'host', operator: '=', value: 'web-1', condition: '' }]);
    });

    it('should pass group by dimensions from legacy GroupByVariable when enableGroupBy is not set', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const groupByVariable = new GroupByVariable({
        datasource: { uid: 'test-uid' },
        defaultOptions: [{ text: 'A' }, { text: 'B' }],
        value: ['A', 'B'],
      });

      const scene = new EmbeddedScene({
        $data: queryRunner,
        $variables: new SceneVariableSet({ variables: [groupByVariable] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      deactivationHandlers.push(activateFullSceneTree(scene));

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].groupByKeys).toEqual(['A', 'B']);

      groupByVariable.changeValueTo(['C', 'D']);

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].groupByKeys).toEqual(['C', 'D']);
    });
  });

  describe('Query controller', () => {
    it('should register itself', async () => {
      const queryController = new SceneQueryController();
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $behaviors: [queryController],
        $timeRange: new SceneTimeRange(),
      });

      const queryControllerStates: SceneQueryStateControllerState[] = [];
      queryController.subscribeToState((s) => {
        queryControllerStates.push(s);
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 200));

      expect(queryControllerStates[0].isRunning).toEqual(true);
      expect(queryControllerStates[1].isRunning).toEqual(false);
    });
  });

  describe('when container width changed during deactivation', () => {
    it('and container width is 0 but previously was rendered', async () => {
      const timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        maxDataPointsFromWidth: true,
        queries: [{ refId: 'A' }],
        $timeRange: timeRange,
      });

      expect(queryRunner.state.data).toBeUndefined();

      const deactivateQueryRunner = queryRunner.activate();
      queryRunner.setContainerWidth(1000);

      // When consumer viz is rendered with width 1000
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall1 = runRequestMock.mock.calls[0];
      // should be run with default maxDataPoints
      expect(runRequestCall1[1].maxDataPoints).toEqual(1000);
      deactivateQueryRunner();

      // When width is externally set to 0 before the consumer container has not yet rendered with expected width
      queryRunner.setContainerWidth(0);
      queryRunner.activate();

      timeRange.setState({ from: 'now-10m' });
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].maxDataPoints).toEqual(1000);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });
  });

  describe('when activated and maxDataPointsFromWidth set to true', () => {
    it('should run queries when container width is received', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        maxDataPointsFromWidth: true,
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBeUndefined();

      queryRunner.setContainerWidth(1000);

      expect(queryRunner.state.data?.state).toBeUndefined();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });

    it('should not run queries when container width is received and data has already been fetched', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        maxDataPointsFromWidth: true,
      });

      queryRunner.activate();
      queryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(runRequestMock.mock.calls.length).toBe(1);

      const clonedQueryRunner = queryRunner.clone();
      clonedQueryRunner.activate();
      clonedQueryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 1));

      // should not issue new query
      expect(runRequestMock.mock.calls.length).toBe(1);
    });
  });

  describe('When query is using variable that is still loading', () => {
    it('Should not executed query on activate', async () => {
      const variable = new TestVariable({ name: 'A', value: '1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(variable.state.loading).toBe(true);
      expect(queryRunner.state.data?.state).toBe('Loading');
      expect(runRequestMock.mock.calls.length).toBe(0);
    });

    it('Should produce valid PanelData when a variable is loading', async () => {
      const variable = new TestVariable({ name: 'A', value: '1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe('Loading');
      expect(queryRunner.state.data?.timeRange).toBeDefined();
      expect(queryRunner.state.data?.series).toBeDefined();
    });

    it('Should not executed query on activate even when maxDataPointsFromWidth is true', async () => {
      const variable = new TestVariable({ name: 'A', value: '1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        maxDataPointsFromWidth: true,
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      queryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 1));

      expect(variable.state.loading).toBe(true);
      expect(queryRunner.state.data?.state).toBe('Loading');
      expect(runRequestMock.mock.calls.length).toBe(0);
    });

    it('Should not executed query when time range change', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      timeRange.onRefresh();

      await new Promise((r) => setTimeout(r, 1));

      expect(variable.state.loading).toBe(true);
      expect(queryRunner.state.data?.state).toBe('Loading');
      expect(runRequestMock.mock.calls.length).toBe(0);
    });

    it('Should execute query when variable updates', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });
      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      variable.changeValueTo('AB');

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should not execute query twice when time range changes and the query is using a time macro', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$__from' }],
      });

      const timeRange = new SceneTimeRange();
      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(runRequestMock.mock.calls.length).toBe(1);

      timeRange.onRefresh();

      await new Promise((r) => setTimeout(r, 2));

      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should not execute query when variable updates, but maxDataPointsFromWidth is true and width not received yet', async () => {
      const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        maxDataPointsFromWidth: true,
      });

      const timeRange = new SceneTimeRange();

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: timeRange,
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      // not execute on variable update because width not received yet
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(undefined);

      variable.changeValueTo('AB');
      await new Promise((r) => setTimeout(r, 1));
      expect(runRequestMock.mock.calls.length).toBe(0);
      expect(queryRunner.state.data?.state).toBe(undefined);

      // should execute when width has finally been set
      queryRunner.setContainerWidth(1000);
      await new Promise((r) => setTimeout(r, 1));
      expect(runRequestMock.mock.calls.length).toBe(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });

    it('Should execute query when variable updates and data layer response was received before', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', text: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        maxDataPointsFromWidth: true,
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      queryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 1));

      // Verify no query executed
      expect(runRequestMock.mock.calls.length).toBe(0);

      // Simulate data layer received
      queryRunner.setState({ data: emptyPanelData });

      // Now variable completes
      variable.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(1);
    });

    it('Should execute query again after variable changed while inactive', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const innerScene = new TestScene({
        $data: queryRunner,
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        nested: innerScene,
      });

      scene.activate();
      const deactivateInnerScene = innerScene.activate();

      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // simulate we collapse a part of the scene where this query runner is
      deactivateInnerScene();

      variable.changeValueTo('AB');

      await new Promise((r) => setTimeout(r, 1));
      // Should not execute query
      expect(runRequestMock.mock.calls.length).toBe(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // now activate again it should detect value change and issue new query
      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should execute query a second time
      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should execute query when new local variable is added/removed', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*', delayMs: 0 });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const innerScene = new TestScene({
        $data: queryRunner,
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        nested: innerScene,
      });

      scene.activate();
      const deactivateInnerScene = innerScene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // replace variable
      const localVar = new LocalValueVariable({ name: 'A', value: 'localValue' });
      innerScene.setState({ $variables: new SceneVariableSet({ variables: [localVar] }) });

      // deactivate and activate
      deactivateInnerScene();
      innerScene.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should execute query
      expect(runRequestMock.mock.calls.length).toBe(2);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });

    it('Should execute query again after variable changed while whole scene was inactive', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
      });

      const deactivateScene = scene.activate();

      // should execute query when variable completes update
      variable.signalUpdateCompleted();
      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // Deactivate scene which deactivates SceneVariableSet
      deactivateScene();

      // Now change value
      variable.changeValueTo('AB');
      // Allow rxjs logic time run
      await new Promise((r) => setTimeout(r, 1));
      // Should not execute query
      expect(runRequestMock.mock.calls.length).toBe(1);
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      // now activate again it should detect value change and issue new query
      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should execute query a second time
      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should execute query when variables changed after clone', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
      });

      scene.activate();

      // should execute query when variable completes update
      variable.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

      const clone = new TestScene({
        $variables: new SceneVariableSet({ variables: [new LocalValueVariable({ name: 'A', value: 'local' })] }),
        $data: queryRunner.clone(),
      });

      scene.setState({ nested: clone });

      clone.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('When depending on a variable that depends on a variable that depends on time range', async () => {
      const varA = new TestVariable({
        name: 'A',
        value: 'AA',
        query: 'A.*',
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      const varB = new TestVariable({ name: 'B', value: 'AA', query: 'A.$A.*' });
      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A', query: '$B' }] });
      const timeRange = new SceneTimeRange();

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [varA, varB] }),
        $timeRange: timeRange,
        $data: queryRunner,
      });

      scene.activate();

      varA.signalUpdateCompleted();
      varB.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      // Should run query
      expect(runRequestMock.mock.calls.length).toBe(1);

      // Now change time range
      timeRange.onRefresh();

      // Allow rxjs logic time run
      await new Promise((r) => setTimeout(r, 1));

      expect(varA.state.loading).toBe(true);

      varA.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      // Since varA did not change here varB should not be loading
      expect(varB.state.loading).toBe(false);

      // should execute new query
      expect(runRequestMock.mock.calls.length).toBe(2);
    });

    it('Should not issue query when unrealted variable completes and _isWaitingForVariables is false', async () => {
      const varA = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
      const varB = new TestVariable({ name: 'B', value: 'AA', query: 'A.$A.*' });

      // Query only depends on A
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        maxDataPointsFromWidth: true,
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [varA, varB] }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
      });

      scene.activate();

      // should execute query when variable completes update
      varA.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      // still waiting for containerWidth
      expect(runRequestMock.mock.calls.length).toBe(0);

      queryRunner.setContainerWidth(1000);

      await new Promise((r) => setTimeout(r, 10));

      expect(runRequestMock.mock.calls.length).toBe(1);

      // Variable that is not a dependency completes
      varB.signalUpdateCompleted();

      await new Promise((r) => setTimeout(r, 1));

      // should not result in a new query
      expect(runRequestMock.mock.calls.length).toBe(1);
    });

    it('Should set data and loadingState to Done when there are no queries', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [],
      });

      const scene = new SceneFlexLayout({
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(runRequestMock.mock.calls.length).toBe(0);
    });

    it('if datasource not set check queries for datasource', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', datasource: { uid: 'Muuu' } }],
      });

      const scene = new SceneFlexLayout({
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();

      const getDataSourceCall = getDataSourceMock.mock.calls[0];
      expect(getDataSourceCall[0]).toEqual({ uid: 'Muuu' });
    });

    it('should keep non-Mixed runtime datasource for templated datasource variable with single selected value', async () => {
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', datasource: { uid: '${ds}', type: 'prometheus' } }],
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({
          variables: [new ConstantVariable({ name: 'ds', value: 'uid-1' })],
        }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(getDataSourceMock.mock.calls[0][0]).toEqual({ uid: '${ds}', type: 'prometheus' });
      expect(sentRequest?.targets[0].datasource).toEqual({ uid: 'test-uid' });
      expect(queryRunner.state.datasource).toBeUndefined();
    });

    it('should resolve runtime datasource to Mixed when a datasource variable has multiple selected values', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: '${ds}', type: 'prometheus' },
        queries: [{ refId: 'A' }],
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({
          variables: [new ConstantVariable({ name: 'ds', value: ['uid-1', 'uid-2'] })],
        }),
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        children: [],
      });

      scene.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(getDataSourceMock.mock.calls[0][0]).toEqual({ type: 'mixed', uid: '-- Mixed --' });
      expect(sentRequest?.targets[0].datasource).toEqual({ uid: '${ds}', type: 'prometheus' });
      expect(queryRunner.state.datasource).toEqual({ uid: '${ds}', type: 'prometheus' });
    });

    it('Should interpolate a variable when used in query options', async () => {
      const variable = new TestVariable({ name: 'A', value: '1h' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', query: '$A' }],
        $variables: new SceneVariableSet({ variables: [variable] }),
        minInterval: '${A}',
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest).toBeDefined();
      const { scopedVars } = sentRequest!;

      expect(scopedVars.__interval?.text).toBe('1h');
      expect(scopedVars.__interval?.value).toBe('1h');
    });
  });

  describe('Supporting custom runtime data source', () => {
    it('Should find and use runtime registered data source', async () => {
      const uid = 'my-custom-datasource-uid';

      registerRuntimeDataSource({ dataSource: new CustomDataSource(uid) });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', datasource: { uid } }],
      });

      queryRunner.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.series[0].fields[0].values[0]).toBe(123);

      runtimeDataSources.clear();
    });
  });

  describe('when time range changed while in-active', () => {
    it('It should re-issue new query', async () => {
      const from = '2000-01-01';
      const to = '2000-01-02';
      const timeRange = new SceneTimeRange({ from, to });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: timeRange,
      });

      expect(queryRunner.state.data).toBeUndefined();

      const deactivateQueryRunner = queryRunner.activate();

      // When consumer viz is rendered with width 1000
      await new Promise((r) => setTimeout(r, 1));
      // Should query
      expect(runRequestMock.mock.calls.length).toEqual(1);

      deactivateQueryRunner();

      const differentTo = '2000-01-03';
      timeRange.setState({ from, to: differentTo });
      timeRange.onRefresh();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should run new query
      expect(runRequestMock.mock.calls.length).toEqual(2);
    });
  });

  describe('when time range changed to identical range while in-active', () => {
    it('It should not re-issue new query', async () => {
      const from = '2000-01-01';
      const to = '2000-01-02';
      const timeRange = new SceneTimeRange({ from, to });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: timeRange,
      });

      expect(queryRunner.state.data).toBeUndefined();

      const deactivateQueryRunner = queryRunner.activate();

      // When consumer viz is rendered with width 1000
      await new Promise((r) => setTimeout(r, 1));
      // Should query
      expect(runRequestMock.mock.calls.length).toEqual(1);

      deactivateQueryRunner();

      // Setting the state to an equivalent time range
      timeRange.setState({ from, to });
      timeRange.onRefresh();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      // Should not any new query
      expect(runRequestMock.mock.calls.length).toEqual(1);
    });
  });

  describe('extra requests', () => {
    test('should run and rerun extra requests', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
      });
      const provider = new TestExtraQueryProvider({ foo: 1 }, true);
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [provider],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      // activate the scene, which will also activate the provider
      // and the provider will run the extra request
      scene.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);
      let runRequestCall = runRequestMock.mock.calls[0];
      let extraRunRequestCall = runRequestMock.mock.calls[1];
      expect(runRequestCall[1].targets[0].refId).toEqual('A');
      expect(extraRunRequestCall[1].targets[0].refId).toEqual('Extra');
      expect(extraRunRequestCall[1].targets[0].foo).toEqual(1);

      // change the state of the provider, which will trigger the activation
      // handler to run the extra request again.
      provider.setState({ foo: 2 });
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(4);
      runRequestCall = runRequestMock.mock.calls[2];
      extraRunRequestCall = runRequestMock.mock.calls[3];
      expect(runRequestCall[1].targets[0].refId).toEqual('A');
      expect(extraRunRequestCall[1].targets[0].refId).toEqual('Extra');
      expect(extraRunRequestCall[1].targets[0].foo).toEqual(2);
    });

    test('should not rerun extra requests when providers say not to', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
      });
      const provider = new TestExtraQueryProvider({ foo: 1 }, false);
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [provider],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      // activate the scene, which will also activate the provider
      // and the provider will run the extra request
      scene.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);
      let runRequestCall = runRequestMock.mock.calls[0];
      let extraRunRequestCall = runRequestMock.mock.calls[1];
      expect(runRequestCall[1].targets[0].refId).toEqual('A');
      expect(extraRunRequestCall[1].targets[0].refId).toEqual('Extra');
      expect(extraRunRequestCall[1].targets[0].foo).toEqual(1);

      // change the state of the provider, which will trigger the activation
      // handler to run the extra request again. The provider will
      // return false from shouldRun, so we should not see any more queries.
      provider.setState({ foo: 2 });
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);
    });
  });

  // Tests for the merge step where the primary and all secondary streams are combined with combineLatest and piped through extraQueryProcessingOperator
  describe('secondary query merging', () => {
    const tick = () => new Promise((r) => setTimeout(r, 1));

    const buildScene = (providers: TestExtraQueryProvider[], queries: SceneDataQuery[] = [{ refId: 'A' }]) => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });
      const queryRunner = new SceneQueryRunner({ queries });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: providers,
        body: new SceneCanvasText({ text: 'hello' }),
      });
      return { scene, queryRunner };
    };

    it('appends a passthrough secondary (no processor) after the primary series', async () => {
      const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secA')]);
      const { scene, queryRunner } = buildScene([provider]);

      scene.activate();
      await tick();

      expect(runRequestMock).toHaveBeenCalledTimes(2);
      expect(queryRunner.state.data?.series.map((s) => s.refId)).toEqual(['A', 'secA']);
    });

    it('spreads the primary PanelData into the merged result', async () => {
      const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secA')]);
      const { scene, queryRunner } = buildScene([provider]);

      scene.activate();
      await tick();

      // state, request and timeRange all originate from the primary response.
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      expect(queryRunner.state.data?.request?.requestId).toBe(runRequestMock.mock.calls[0][1].requestId);
      expect(queryRunner.state.data?.timeRange).toEqual(runRequestMock.mock.calls[0][1].range);
    });

    it('applies the descriptor processor to the secondary series', async () => {
      const renameProcessor: ExtraQueryDataProcessor = (_primary, secondary) =>
        of({
          ...secondary,
          series: secondary.series.map((frame) => ({
            ...frame,
            refId: `${frame.refId}-processed`,
            meta: { ...frame.meta, custom: { processed: true } },
          })),
        });

      const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secA', renameProcessor)]);
      const { scene, queryRunner } = buildScene([provider]);

      scene.activate();
      await tick();

      const series = queryRunner.state.data?.series ?? [];
      expect(series.map((s) => s.refId)).toEqual(['A', 'secA-processed']);
      expect(series[1].meta?.custom).toEqual({ processed: true });
    });

    it('merges multiple secondaries from a single provider in order', async () => {
      const provider = new TestExtraQueryProvider({ foo: 1 }, false, [
        secondaryDescriptor('secA'),
        secondaryDescriptor('secB'),
      ]);
      const { scene, queryRunner } = buildScene([provider]);

      scene.activate();
      await tick();

      expect(runRequestMock).toHaveBeenCalledTimes(3);
      expect(queryRunner.state.data?.series.map((s) => s.refId)).toEqual(['A', 'secA', 'secB']);
    });

    it('merges secondaries contributed by multiple providers', async () => {
      const providerA = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secA')]);
      const providerB = new SecondTestExtraQueryProvider({ foo: 2 }, false, [secondaryDescriptor('secB')]);
      const { scene, queryRunner } = buildScene([providerA, providerB]);

      scene.activate();
      await tick();

      expect(runRequestMock).toHaveBeenCalledTimes(3);
      const refIds = queryRunner.state.data?.series.map((s) => s.refId) ?? [];
      expect(refIds[0]).toBe('A');
      expect(refIds.slice(1).sort()).toEqual(['secA', 'secB']);
    });

    it('concatenates annotations from a secondary onto the primary annotations', async () => {
      const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secAnnotations')]);
      const { scene, queryRunner } = buildScene([provider], [{ refId: 'withAnnotations' }]);

      scene.activate();
      await tick();

      const annotationNames = (queryRunner.state.data?.annotations ?? []).map((frame) => frame.name);
      expect(annotationNames).toContain('exemplar');
      expect(annotationNames).toContain('secondary annotation');
    });

    describe('stream combination semantics', () => {
      const panelData = (over: Partial<PanelData> = {}): PanelData => ({
        state: LoadingState.Done,
        series: [],
        annotations: [],
        timeRange: {} as any,
        request: { requestId: 'controlled' } as any,
        ...over,
      });

      it('emits when primary and all secondaries complete', async () => {
        const primarySubject = new Subject<PanelData>();
        const secondarySubject = new Subject<PanelData>();
        runRequestMock.mockImplementationOnce(() => primarySubject).mockImplementationOnce(() => secondarySubject);

        const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secCtrl')]);
        const { scene, queryRunner } = buildScene([provider]);

        scene.activate();
        await tick();
        expect(runRequestMock).toHaveBeenCalledTimes(2);

        // Only the primary has completed: secondary must not have emitted yet.
        primarySubject.next(panelData({ series: [toDataFrame({ refId: 'A', datapoints: [[1, 1]] })] }));
        primarySubject.complete();
        await tick();
        expect(queryRunner.state.data).toBeUndefined();

        // Once the secondary completes too, the combined result is emitted.
        secondarySubject.next(
          panelData({
            series: [toDataFrame({ refId: 'secCtrl', datapoints: [[2, 1]] })],
            request: { requestId: 'sec-controlled' } as any,
          })
        );
        secondarySubject.complete();
        await tick();

        expect(queryRunner.state.data?.series.map((s) => s.refId)).toEqual(['A', 'secCtrl']);
        expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
      });

      it('emits error when secondary reports an error', async () => {
        const primarySubject = new Subject<PanelData>();
        const secondarySubject = new Subject<PanelData>();
        runRequestMock.mockImplementationOnce(() => primarySubject).mockImplementationOnce(() => secondarySubject);

        const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secCtrl')]);
        const { scene, queryRunner } = buildScene([provider]);

        scene.activate();
        await tick();

        primarySubject.next(panelData({ series: [toDataFrame({ refId: 'A', datapoints: [[1, 1]] })] }));
        primarySubject.complete();
        secondarySubject.next(
          panelData({
            state: LoadingState.Error,
            series: [toDataFrame({ refId: 'secCtrl', datapoints: [[2, 1]] })],
            errors: [{ message: 'secondary boom' }],
            request: { requestId: 'sec-controlled' } as any,
          })
        );
        secondarySubject.complete();
        await tick();

        // The merged state is taken from the primary, so the secondary error is masked,
        // but its series are still merged in.
        expect(queryRunner.state.data?.state).toBe(LoadingState.Error);
        expect(queryRunner.state.data?.series.map((s) => s.refId)).toEqual(['A', 'secCtrl']);
        expect(queryRunner.state.data?.errors ?? []).toEqual([{ message: 'secondary boom' }]);
      });

      it('tears down the combined subscription when the query is cancelled', async () => {
        const primarySubject = new Subject<PanelData>();
        const secondarySubject = new Subject<PanelData>();
        runRequestMock.mockImplementationOnce(() => primarySubject).mockImplementationOnce(() => secondarySubject);

        const provider = new TestExtraQueryProvider({ foo: 1 }, false, [secondaryDescriptor('secCtrl')]);
        const { scene, queryRunner } = buildScene([provider]);

        scene.activate();
        await tick();
        expect(runRequestMock).toHaveBeenCalledTimes(2);

        queryRunner.cancelQuery();
        expect(queryRunner.state.data?.state).toBe(LoadingState.Done);

        // Emissions after cancellation must not reach the runner.
        primarySubject.next(panelData({ series: [toDataFrame({ refId: 'A', datapoints: [[1, 1]] })] }));
        primarySubject.complete();
        secondarySubject.next(
          panelData({
            series: [toDataFrame({ refId: 'secCtrl', datapoints: [[2, 1]] })],
            request: { requestId: 'sec-controlled' } as DataQueryRequest,
          })
        );
        secondarySubject.complete();
        await tick();

        expect(queryRunner.state.data?.series ?? []).toHaveLength(0);
      });
    });
  });

  describe('time frame comparison', () => {
    test('should run query with time range comparison', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
      });

      const comparer = new SceneTimeRangeCompare({
        compareWith: '7d',
      });

      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];
      const comaprisonRunRequestCall = runRequestMock.mock.calls[1];

      expect(runRequestMock.mock.calls.length).toEqual(2);
      expect(runRequestCall[1].range).toMatchInlineSnapshot(`
        {
          "from": "2023-08-24T05:00:00.000Z",
          "raw": {
            "from": "2023-08-24T05:00:00.000Z",
            "to": "2023-08-24T07:00:00.000Z",
          },
          "to": "2023-08-24T07:00:00.000Z",
        }
      `);

      expect(comaprisonRunRequestCall[1].range).toMatchInlineSnapshot(`
        {
          "from": "2023-08-17T05:00:00.000Z",
          "raw": {
            "from": "2023-08-17T05:00:00.000Z",
            "to": "2023-08-17T07:00:00.000Z",
          },
          "to": "2023-08-17T07:00:00.000Z",
        }
      `);
    });

    test('should not include queries that opted out from time window comparison', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', timeRangeCompare: false }, { refId: 'B' }],
      });

      const comparer = new SceneTimeRangeCompare({
        compareWith: '7d',
      });

      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);
      const comaprisonRunRequestCall = runRequestMock.mock.calls[1];
      expect(comaprisonRunRequestCall[1].targets.length).toEqual(1);
      expect(comaprisonRunRequestCall[1].targets[0].refId).toEqual('B');
    });

    test('should not run time window comparison request if all queries have opted out', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [
          { refId: 'A', timeRangeCompare: false },
          { refId: 'B', timeRangeCompare: false },
        ],
      });

      const comparer = new SceneTimeRangeCompare({
        compareWith: '7d',
      });

      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(1);
    });

    test('should not re-run queries if time window comparison changed when all queries have opted out', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [
          { refId: 'A', timeRangeCompare: false },
          { refId: 'B', timeRangeCompare: false },
        ],
      });

      const comparer = new SceneTimeRangeCompare({
        compareWith: '7d',
      });

      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(1);

      comparer.setState({ compareWith: '1d' });

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(1);
    });

    test('should perform shift query transformation', async () => {
      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'ComparisonQuery' }],
      });

      const comparer = new SceneTimeRangeCompare({
        compareWith: '1h',
      });

      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.series).toHaveLength(2);
      expect(queryRunner.state.data?.series[0].refId).toBe('A');
      expect(queryRunner.state.data?.series[1].refId).toBe('A-compare');
      expect(queryRunner.state.data?.series[0].meta).toBeUndefined();
      expect(queryRunner.state.data?.series[1].meta).toMatchInlineSnapshot(`
        {
          "timeCompare": {
            "diffMs": -3600000,
            "isTimeShiftQuery": true,
          },
        }
      `);
    });
  });

  describe('secondary query loading and error states', () => {
    const tick = () => new Promise((r) => setTimeout(r, 1));

    const panelDataFrom = (request: DataQueryRequest, p: Partial<PanelData>): PanelData => ({
      series: [],
      annotations: [],
      state: LoadingState.Loading,
      timeRange: request.range,
      request,
      ...p,
    });

    // Wire the primary runRequest to one subject and the secondary to another so each can be
    // driven independently. The primary request is issued first, the secondary second.
    const mockPrimaryAndSecondaryStreams = () => {
      const primarySubject = new Subject<Partial<PanelData>>();
      const secondarySubject = new Subject<Partial<PanelData>>();
      runRequestMock
        .mockImplementationOnce((_ds: DataSourceApi, request: DataQueryRequest) =>
          primarySubject.pipe(map((p) => panelDataFrom(request, p)))
        )
        .mockImplementationOnce((_ds: DataSourceApi, request: DataQueryRequest) =>
          secondarySubject.pipe(map((p) => panelDataFrom(request, p)))
        );
      return { primarySubject: primarySubject, secondarySubject: secondarySubject };
    };

    it('emits Loading while the secondary query is still in flight', async () => {
      const { primarySubject, secondarySubject } = mockPrimaryAndSecondaryStreams();

      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }] });
      const provider = new TestExtraQueryProvider({ foo: 1 }, true);
      const scene = new EmbeddedScene({
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        controls: [provider],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      scene.activate();
      await tick();

      // Primary completes but the secondary is still loading -> overall state is Loading.
      primarySubject.next({ state: LoadingState.Done });
      secondarySubject.next({ state: LoadingState.Loading });
      await tick();
      expect(queryRunner.state.data?.state).toBe(LoadingState.Loading);

      // Secondary completes -> overall state transitions to Done.
      secondarySubject.next({ state: LoadingState.Done });
      await tick();
      expect(queryRunner.state.data?.state).toBe(LoadingState.Done);
    });

    it('emits errors when the secondary query fails', async () => {
      const { primarySubject, secondarySubject } = mockPrimaryAndSecondaryStreams();

      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }] });
      const provider = new TestExtraQueryProvider({ foo: 1 }, true);
      const scene = new EmbeddedScene({
        $timeRange: new SceneTimeRange(),
        $data: queryRunner,
        controls: [provider],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      scene.activate();
      await tick();

      primarySubject.next({ state: LoadingState.Done });
      secondarySubject.next({ state: LoadingState.Error, errors: [{ message: 'secondary failed' }] });
      await tick();

      expect(queryRunner.state.data?.state).toBe(LoadingState.Error);
      expect(queryRunner.state.data?.errors).toEqual([{ message: 'secondary failed' }]);
    });

    it('applies requestId suffix when the primary re-emits', async () => {
      const { primarySubject, secondarySubject } = mockPrimaryAndSecondaryStreams();

      const timeRange = new SceneTimeRange({
        from: '2023-08-24T05:00:00.000Z',
        to: '2023-08-24T07:00:00.000Z',
      });
      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }] });
      const comparer = new SceneTimeRangeCompare({ compareWith: '1h' });
      const scene = new EmbeddedScene({
        $timeRange: timeRange,
        $data: queryRunner,
        controls: [comparer],
        body: new SceneFlexLayout({
          children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'A' }) })],
        }),
      });

      scene.activate();
      comparer.activate();
      await tick();

      // A single secondary response object is processed...
      secondarySubject.next({ state: LoadingState.Done, series: [toDataFrame({ refId: 'A', fields: [] })] });
      // ...then the primary re-emits twice, each re-triggering combineLatest against the same secondary.
      // extraQueryProcessingOperator should prevent the processor from re-running and double-suffixing the refId.
      primarySubject.next({ state: LoadingState.Streaming, series: [toDataFrame({ refId: 'A', fields: [] })] });
      primarySubject.next({ state: LoadingState.Done, series: [toDataFrame({ refId: 'A', fields: [] })] });
      await tick();

      const refIds = queryRunner.state.data?.series.map((s) => s.refId) ?? [];
      expect(refIds.filter((refId) => refId === 'A-compare')).toHaveLength(1);
      expect(refIds).not.toContain('A-compare-compare');
    });
  });

  test('enriching query request', async () => {
    const queryRunner = new SceneQueryRunner({
      queries: [{ refId: 'A' }],
      $timeRange: new SceneTimeRange(),
    });

    const scene = new TestSceneWithRequestEnricher({
      $data: queryRunner,
    });

    scene.activate();

    await new Promise((r) => setTimeout(r, 1));

    expect(sentRequest?.app).toBe('enriched');
  });

  describe('data layers', () => {
    it('should run queries for data layers', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({ layers: [layer] }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));
      layer.completeRun();

      expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
        [
          {
            "fields": [
              {
                "config": {},
                "name": "time",
                "type": "time",
                "values": [
                  100,
                ],
              },
              {
                "config": {},
                "name": "text",
                "type": "string",
                "values": [
                  "Layer 1: Test annotation",
                ],
              },
              {
                "config": {},
                "name": "tags",
                "type": "other",
                "values": [
                  [
                    "tag1",
                  ],
                ],
              },
            ],
            "length": 1,
            "meta": {
              "dataTopic": "annotations",
            },
          },
        ]
      `);
    });

    it('should merge but not duplicate annotations coming from query result and from layers', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'withAnnotations' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({ layers: [layer] }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));
      layer.completeRun();

      expect(queryRunner.state.data?.annotations?.[0].meta?.custom?.resultType).toBe('exemplar');
      expect(queryRunner.state.data?.annotations?.[1].meta?.dataTopic).toBe('annotations');

      queryRunner.runQueries();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.annotations?.[0].meta?.custom?.resultType).toBe('exemplar');
      expect(queryRunner.state.data?.annotations?.[1].meta?.dataTopic).toBe('annotations');
    });

    it('should not block queries when layer provides data slower', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({ layers: [layer] }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.annotations).toHaveLength(0);
      expect(queryRunner.state.data?.series).toBeDefined();

      layer.completeRun();

      expect(queryRunner.state.data?.annotations).toHaveLength(1);
    });

    it('should not cause unnessaray state updates', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({ layers: [layer] }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      const stateUpdates: QueryRunnerState[] = [];
      queryRunner.subscribeToState((state) => stateUpdates.push(state));

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.annotations).toHaveLength(0);
      expect(queryRunner.state.data?.series).toBeDefined();

      layer.completeEmpty();

      expect(stateUpdates).toHaveLength(1);
    });

    describe('canceling queries', () => {
      it('should unsubscribe from data layers when query is canceled', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });
        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayerSet({ layers: [layer2] }),
          children: [
            new SceneFlexItem({
              $data: queryRunner,
              body: new SceneCanvasText({ text: 'Test' }),
            }),
          ],
        });
        scene.activate();
        queryRunner.activate();

        await new Promise((r) => setTimeout(r, 1));
        queryRunner.cancelQuery();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`[]`);

        layer1.completeRun();
        layer2.completeRun();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`[]`);
      });

      it('should re-subscribe to data layers when query is canceled and run again', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });
        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayerSet({ layers: [layer2] }),
          children: [
            new SceneFlexItem({
              $data: queryRunner,
              body: new SceneCanvasText({ text: 'Test' }),
            }),
          ],
        });
        scene.activate();
        queryRunner.activate();

        await new Promise((r) => setTimeout(r, 1));
        queryRunner.cancelQuery();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`[]`);

        layer1.completeRun();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`[]`);

        queryRunner.runQueries();
        await new Promise((r) => setTimeout(r, 1));
        layer2.completeRun();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
          [
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 1: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 2: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
          ]
        `);
      });
    });

    describe('Multiple layers', () => {
      it('combines multiple layers attached on the same level', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });

        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1, layer2] }),
        });

        expect(queryRunner.state.data).toBeUndefined();

        queryRunner.activate();
        layer1.completeRun();
        layer2.completeRun();

        await new Promise((r) => setTimeout(r, 1));

        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
          [
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 1: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 2: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
          ]
        `);
      });
      it('combines multiple layers attached on different levels', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });

        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayerSet({ layers: [layer2] }),
          children: [
            new SceneFlexItem({
              $data: queryRunner,
              body: new SceneCanvasText({ text: 'Test' }),
            }),
          ],
        });
        scene.activate();
        queryRunner.activate();
        layer1.completeRun();
        layer2.completeRun();

        await new Promise((r) => setTimeout(r, 1));

        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
          [
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 1: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 2: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
          ]
        `);
      });

      it('combines multiple layers that complete non-simultaneously', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });
        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayerSet({ layers: [layer2] }),
          children: [
            new SceneFlexItem({
              $data: queryRunner,
              body: new SceneCanvasText({ text: 'Test' }),
            }),
          ],
        });
        scene.activate();
        queryRunner.activate();

        await new Promise((r) => setTimeout(r, 1));

        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot('[]');

        layer1.completeRun();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
          [
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 1: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
          ]
        `);
        layer2.completeRun();
        expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`
          [
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 1: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
            {
              "fields": [
                {
                  "config": {},
                  "name": "time",
                  "type": "time",
                  "values": [
                    100,
                  ],
                },
                {
                  "config": {},
                  "name": "text",
                  "type": "string",
                  "values": [
                    "Layer 2: Test annotation",
                  ],
                },
                {
                  "config": {},
                  "name": "tags",
                  "type": "other",
                  "values": [
                    [
                      "tag1",
                    ],
                  ],
                },
              ],
              "length": 1,
              "meta": {
                "dataTopic": "annotations",
              },
            },
          ]
        `);
      });
    });

    describe('filtering results', () => {
      it('should filter Grafana annotations added to a specific panel', async () => {
        const layer1 = new TestAnnotationsDataLayer({
          name: 'Layer 1',
          fakeAnnotations: () => {
            // This function is faking annotation events coming from Grafana data source.
            return [
              {
                panelId: 1,
                source: {
                  type: 'dashboard',
                },
              },
              {
                panelId: 123,
                source: {
                  type: 'dashboard',
                },
              },
              {
                panelId: 2,
                source: {
                  type: 'dashboard',
                },
              },
              {
                panelId: 123,
                source: {
                  type: 'dashboard',
                },
              },
            ];
          },
        });

        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          dataLayerFilter: {
            panelId: 123,
          },
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        queryRunner.activate();
        await new Promise((r) => setTimeout(r, 1));

        layer1.completeRun();

        expect(queryRunner.state.data?.annotations?.[0].length).toEqual(2);
        expect(queryRunner.state.data?.annotations?.[0].fields).toMatchInlineSnapshot(`
          [
            {
              "config": {},
              "name": "text",
              "type": "string",
              "values": [
                "Layer 1: Test annotation",
                "Layer 1: Test annotation",
              ],
            },
            {
              "config": {},
              "name": "panelId",
              "type": "number",
              "values": [
                123,
                123,
              ],
            },
            {
              "config": {},
              "name": "source",
              "type": "other",
              "values": [
                {
                  "type": "dashboard",
                },
                {
                  "type": "dashboard",
                },
              ],
            },
          ]
        `);
      });

      it('should filter annotations with include filter specified', async () => {
        const layer1 = new TestAnnotationsDataLayer({
          name: 'Layer 1',
          fakeAnnotations: () => {
            // This function is faking annotation events coming from Grafana data source.
            return [
              {
                source: {
                  filter: {
                    exclude: false,
                    ids: [1],
                  },
                },
              },
              {
                // this annotation should should be included in panel 123
                source: {
                  filter: {
                    exclude: false,
                    ids: [123],
                  },
                },
              },
              {
                source: {
                  filter: {
                    exclude: false,
                    ids: [2],
                  },
                },
              },
              {
                // this annotation should should be included in panel 123
                source: {
                  filter: {
                    exclude: false,
                    ids: [123],
                  },
                },
              },
            ];
          },
        });

        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          dataLayerFilter: {
            panelId: 123,
          },
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        queryRunner.activate();
        await new Promise((r) => setTimeout(r, 1));
        layer1.completeRun();

        expect(queryRunner.state.data?.annotations?.[0].length).toEqual(2);
        expect(queryRunner.state.data?.annotations?.[0].fields).toMatchInlineSnapshot(`
          [
            {
              "config": {},
              "name": "text",
              "type": "string",
              "values": [
                "Layer 1: Test annotation",
                "Layer 1: Test annotation",
              ],
            },
            {
              "config": {},
              "name": "source",
              "type": "other",
              "values": [
                {
                  "filter": {
                    "exclude": false,
                    "ids": [
                      123,
                    ],
                  },
                },
                {
                  "filter": {
                    "exclude": false,
                    "ids": [
                      123,
                    ],
                  },
                },
              ],
            },
          ]
        `);
      });

      it('should filter annotations with exlude filter specified', async () => {
        const layer1 = new TestAnnotationsDataLayer({
          name: 'Layer 1',
          fakeAnnotations: () => {
            // This function is faking annotation events with exclude filter
            return [
              {
                // this annotation should we returned
                source: {
                  filter: {
                    exclude: true,
                    ids: [1],
                  },
                },
              },
              {
                // this annotation should should be excluded from panel 123
                source: {
                  filter: {
                    exclude: true,
                    ids: [123],
                  },
                },
              },
              {
                // this annotation should should be excluded from panel 123
                source: {
                  filter: {
                    exclude: true,
                    ids: [123],
                  },
                },
              },
            ];
          },
        });

        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          dataLayerFilter: {
            panelId: 123,
          },
          $data: new SceneDataLayerSet({ layers: [layer1] }),
        });

        queryRunner.activate();
        await new Promise((r) => setTimeout(r, 1));

        layer1.completeRun();
        expect(queryRunner.state.data?.annotations?.[0].length).toEqual(1);
        expect(queryRunner.state.data?.annotations?.[0].fields).toMatchInlineSnapshot(`
          [
            {
              "config": {},
              "name": "text",
              "type": "string",
              "values": [
                "Layer 1: Test annotation",
              ],
            },
            {
              "config": {},
              "name": "source",
              "type": "other",
              "values": [
                {
                  "filter": {
                    "exclude": true,
                    "ids": [
                      1,
                    ],
                  },
                },
              ],
            },
          ]
        `);
      });

      it('filters alert states for a given panel', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAlertStatesDataLayer({ name: 'Layer 2' });

        const queryRunner = new SceneQueryRunner({
          dataLayerFilter: {
            panelId: 123,
          },
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({ layers: [layer1, layer2] }),
        });

        expect(queryRunner.state.data).toBeUndefined();

        queryRunner.activate();
        layer1.completeRun();
        layer2.completeRun();

        await new Promise((r) => setTimeout(r, 1));
        expect(queryRunner.state.data?.alertState).toMatchInlineSnapshot(`
          {
            "dashboardId": 1,
            "id": 1,
            "panelId": 123,
            "state": "alerting",
          }
        `);
      });
    });
  });

  describe('when cloning', () => {
    it('should clone query runner with necessary private members', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'withAnnotations' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({ layers: [layer] }),
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));
      layer.completeRun();

      const clone = queryRunner.clone();

      expect(clone['_resultAnnotations']).not.toBeUndefined();
      expect(clone['_resultAnnotations']?.length).toBe(1);
      expect(clone['_resultAnnotations']).toStrictEqual(queryRunner['_resultAnnotations']);
      expect(clone['_layerAnnotations']).not.toBeUndefined();
      expect(clone['_layerAnnotations']?.length).toBe(1);
      expect(clone['_layerAnnotations']).toStrictEqual(queryRunner['_layerAnnotations']);
      expect(clone['_results']['_buffer']).not.toEqual([]);
    });
  });

  describe('scopes', () => {
    it('should run queries with scopes when ScopesVariable is provided', async () => {
      const scopesVariable = new ScopesVariable({
        scopes: [
          {
            metadata: { name: 'Scope 1' },
            spec: {
              title: 'Scope 1',
              type: 'test',
              description: 'Test scope',
              category: 'test',
              filters: [],
            },
          },
        ],
        loading: false,
      });

      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        $variables: new SceneVariableSet({ variables: [scopesVariable] }),
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest?.scopes).toBeDefined();
      expect(sentRequest?.scopes?.[0]).toMatchObject({
        metadata: { name: 'Scope 1' },
        spec: {
          title: 'Scope 1',
          type: 'test',
        },
      });
    });
  });

  it('should not pass scopes in request when no ScopesVariable in scene', async () => {
    const queryRunner = new SceneQueryRunner({
      queries: [{ refId: 'A' }],
      $timeRange: new SceneTimeRange(),
    });

    queryRunner.activate();

    await new Promise((r) => setTimeout(r, 1));

    expect(sentRequest?.scopes).toBeUndefined();
  });

  describe('onDataReceived series identity preservation', () => {
    let subject: Subject<DataQueryResponse>;
    let queryRunner: SceneQueryRunner;
    const tick = () => new Promise((r) => setTimeout(r, 1));

    beforeEach(async () => {
      subject = new Subject<DataQueryResponse>();
      runRequestMock.mockImplementationOnce(() =>
        subject.pipe(map((packet) => ({ state: LoadingState.Done, series: packet.data, timeRange: {} as any })))
      );
      queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }], $timeRange: new SceneTimeRange() });
      queryRunner.activate();
      await tick();
    });

    it('should preserve series reference when same frame objects are emitted again', async () => {
      const frame = toDataFrame({ refId: 'A', datapoints: [[100, 1]] });

      subject.next({ data: [frame] });
      await tick();
      const firstSeries = queryRunner.state.data?.series;

      subject.next({ data: [frame] });
      await tick();

      expect(queryRunner.state.data?.series).toBe(firstSeries);
    });

    it('should emit new series reference when frame objects change', async () => {
      subject.next({ data: [toDataFrame({ refId: 'A', datapoints: [[100, 1]] })] });
      await tick();
      const firstSeries = queryRunner.state.data?.series;

      subject.next({ data: [toDataFrame({ refId: 'A', datapoints: [[999, 1]] })] });
      await tick();

      expect(queryRunner.state.data?.series).not.toBe(firstSeries);
    });
  });

  describe('when deactivated with incomplete data', () => {
    it('should clear incomplete data and re-run queries on reactivation', async () => {
      const tick = () => new Promise((r) => setTimeout(r, 1));
      const subject = new Subject<DataQueryResponse>();
      runRequestMock.mockImplementationOnce(() =>
        subject.pipe(map(() => ({ state: LoadingState.Loading, series: [], timeRange: {} as any })))
      );

      const queryRunner = new SceneQueryRunner({ queries: [{ refId: 'A' }], $timeRange: new SceneTimeRange() });
      const deactivate = queryRunner.activate();
      await tick();

      subject.next({ data: [] });
      await tick();
      expect(queryRunner.state.data?.state).toBe(LoadingState.Loading);

      deactivate();
      expect(queryRunner.state.data).toBeUndefined();

      runRequestMock.mockClear();
      queryRunner.activate();
      await tick();

      expect(runRequestMock).toHaveBeenCalledTimes(1);
    });
  });
});

class CustomDataSource extends RuntimeDataSource {
  public constructor(uid: string) {
    super('my-custom-datasource-plugin-id', uid);
  }

  public query(options: DataQueryRequest<DataQuery>): Observable<DataQueryResponse> {
    return of({ data: [{ refId: 'A', fields: [{ name: 'time', type: FieldType.time, values: [123] }] }] });
  }
}

interface TestExtraQueryProviderState extends SceneObjectState {
  foo: number;
}

class TestExtraQueryProvider extends SceneObjectBase<TestExtraQueryProviderState> implements ExtraQueryProvider<{}> {
  private _shouldRerun: boolean;
  private _descriptors?: ExtraQueryDescriptor[];

  public constructor(state: { foo: number }, shouldRerun: boolean, descriptors?: ExtraQueryDescriptor[]) {
    super(state);
    this._shouldRerun = shouldRerun;
    this._descriptors = descriptors;
  }

  public getExtraQueries(): ExtraQueryDescriptor[] {
    // When explicit descriptors are provided, use them so tests can exercise
    // multiple secondaries, missing processors (passthrough), etc.
    if (this._descriptors) {
      return this._descriptors;
    }

    return [
      {
        req: {
          targets: [
            // @ts-expect-error
            { refId: 'Extra', foo: this.state.foo },
          ],
        },
        processor: (primary, secondary) => of({ ...primary, ...secondary }),
      },
    ];
  }
  public shouldRerun(prev: {}, next: {}): boolean {
    return this._shouldRerun;
  }
}

// A distinct provider class. `getClosestExtraQueryProviders` de-duplicates
// providers by their constructor, so testing multiple providers at once
// requires more than one class.
class SecondTestExtraQueryProvider extends TestExtraQueryProvider {}

// Build an ExtraQueryDescriptor whose secondary request targets a single refId.
// The shared datasource mock echoes any refId starting with `sec` (see
// getDataSourceMock) so the merged series can be asserted by refId.
function secondaryDescriptor(refId: string, processor?: ExtraQueryDataProcessor): ExtraQueryDescriptor {
  return {
    req: { targets: [{ refId }] } as DataQueryRequest,
    processor,
  };
}
