import { map, Observable, of } from 'rxjs';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  FieldType,
  LoadingState,
  PanelData,
  toDataFrame,
  VariableRefresh,
} from '@grafana/data';

import { SceneTimeRange } from '../core/SceneTimeRange';

import { SceneQueryRunner } from './SceneQueryRunner';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';
import { TestScene } from '../variables/TestScene';
import { RuntimeDataSource, registerRuntimeDataSource } from './RuntimeDataSource';
import { DataQuery } from '@grafana/schema';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { SceneTimeRangeCompare } from '../components/SceneTimeRangeCompare';
import { SceneDataLayers } from './SceneDataLayers';
import { TestAlertStatesDataLayer, TestAnnotationsDataLayer } from './layers/TestDataLayer';
import { TestSceneWithRequestEnricher } from '../utils/test/TestSceneWithRequestEnricher';
import { AdHocFilterSet } from '../variables/adhoc/AdHocFiltersSet';
import { emptyPanelData } from '../core/SceneDataNode';
import { AggregationsSet } from '../variables/groupby/AggregationsSet';

const getDataSourceMock = jest.fn().mockReturnValue({
  uid: 'test-uid',
  getRef: () => ({ uid: 'test-uid' }),
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
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = {
    state: LoadingState.Loading,
    series: [],
    annotations: [],
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
    theme: {
      palette: {
        gray60: '#666666',
      },
    },
  },
}));

describe('SceneQueryRunner', () => {
  afterEach(() => {
    runRequestMock.mockClear();
    getDataSourceMock.mockClear();
  });

  describe('when running query', () => {
    it('should build DataQueryRequest object', async () => {
      Date.now = jest.fn(() => 1689063488000);
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
      });

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(sentRequest).toBeDefined();
      const { scopedVars, ...request } = sentRequest!;

      expect(Object.keys(scopedVars)).toMatchInlineSnapshot(`
        [
          "__sceneObject",
          "__interval",
          "__interval_ms",
        ]
      `);
      expect(request).toMatchInlineSnapshot(`
        {
          "app": "scenes",
          "interval": "30s",
          "intervalMs": 30000,
          "liveStreaming": undefined,
          "maxDataPoints": 500,
          "panelId": 1,
          "range": {
            "from": "2023-07-11T02:18:08.000Z",
            "raw": {
              "from": "now-6h",
              "to": "now",
            },
            "to": "2023-07-11T08:18:08.000Z",
          },
          "rangeRaw": {
            "from": "now-6h",
            "to": "now",
          },
          "requestId": "SQR100",
          "startTime": 1689063488000,
          "targets": [
            {
              "datasource": {
                "uid": "test-uid",
              },
              "refId": "A",
            },
          ],
          "timezone": "browser",
        }
      `);
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

      const getDataSourceCall = getDataSourceMock.mock.calls[0];
      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].scopedVars.__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
      expect(getDataSourceCall[1].__sceneObject).toEqual({ value: queryRunner, text: '__sceneObject' });
    });

    it('should pass adhoc filters via request object', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const filterSet = new AdHocFilterSet({
        datasource: { uid: 'test-uid' },
        filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
      });

      new EmbeddedScene({
        $data: queryRunner,
        controls: [filterSet],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();
      filterSet.activate();

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].filters).toEqual(filterSet.state.filters);

      // Verify updating filter re-triggers query
      filterSet._updateFilter(filterSet.state.filters[0], 'value', 'newValue');

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(runRequestCall2[1].filters).toEqual(filterSet.state.filters);
    });

    it('should pass adhoc aggregations via request object', async () => {
      const queryRunner = new SceneQueryRunner({
        datasource: { uid: 'test-uid' },
        queries: [{ refId: 'A' }],
      });

      const aggregationsSet = new AggregationsSet({
        datasource: { uid: 'test-uid' },
        dimensions: ['a', 'b', 'c'],
      });

      new EmbeddedScene({
        $data: queryRunner,
        controls: [aggregationsSet],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();
      aggregationsSet.activate();

      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].aggregations).toEqual(aggregationsSet.state.dimensions);

      // Verify updating filter re-triggers query
      aggregationsSet._updateDimensions(['e', 'f']);

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toEqual(2);

      const runRequestCall2 = runRequestMock.mock.calls[1];
      expect(aggregationsSet.state.dimensions).toEqual(['e', 'f']);
      expect(runRequestCall2[1].aggregations).toEqual(aggregationsSet.state.dimensions);
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
      expect(queryRunner.state.data?.state).toBe(undefined);
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

      expect(queryRunner.state.data?.state).toBe(undefined);
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

      expect(queryRunner.state.data?.state).toBe(undefined);
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

      expect(queryRunner.state.data?.series[0].fields[0].values.get(0)).toBe(123);
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
        $data: new SceneDataLayers({ layers: [layer] }),
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
          },
        ]
      `);
    });

    it('should merge but not duplicate annotations coming from query result and from layers', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'withAnnotations' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayers({ layers: [layer] }),
      });

      const expectedSnapshot = `
      [
        {
          "fields": [
            {
              "config": {},
              "labels": undefined,
              "name": "foo",
              "type": "string",
              "values": [
                "foo1",
                "foo2",
                "foo3",
              ],
            },
            {
              "config": {},
              "labels": undefined,
              "name": "bar",
              "type": "string",
              "values": [
                "bar1",
                "bar2",
                "bar3",
              ],
            },
          ],
          "meta": {
            "custom": {
              "resultType": "exemplar",
            },
            "dataTopic": "annotations",
            "typeVersion": [
              0,
              0,
            ],
          },
          "name": "exemplar",
          "refId": "withAnnotations",
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
        },
      ]
    `;

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));
      layer.completeRun();

      expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(expectedSnapshot);

      queryRunner.runQueries();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(expectedSnapshot);
    });

    it('should not block queries when layer provides data slower', async () => {
      const layer = new TestAnnotationsDataLayer({ name: 'Layer 1' });
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayers({ layers: [layer] }),
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(queryRunner.state.data?.annotations).toMatchInlineSnapshot(`[]`);
      expect(queryRunner.state.data?.series).toBeDefined();

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
          },
        ]
      `);
    });

    describe('canceling queries', () => {
      it('should unsubscribe from data layers when query is canceled', async () => {
        const layer1 = new TestAnnotationsDataLayer({ name: 'Layer 1' });
        const layer2 = new TestAnnotationsDataLayer({ name: 'Layer 2' });
        const queryRunner = new SceneQueryRunner({
          queries: [{ refId: 'A' }],
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayers({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayers({ layers: [layer2] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayers({ layers: [layer2] }),
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
          $data: new SceneDataLayers({ layers: [layer1, layer2] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayers({ layers: [layer2] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
        });

        const scene = new SceneFlexLayout({
          $data: new SceneDataLayers({ layers: [layer2] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
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
          $data: new SceneDataLayers({ layers: [layer1] }),
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
          $data: new SceneDataLayers({ layers: [layer1, layer2] }),
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
});

class CustomDataSource extends RuntimeDataSource {
  public constructor(uid: string) {
    super('my-custom-datasource-plugin-id', uid);
  }

  public query(options: DataQueryRequest<DataQuery>): Observable<DataQueryResponse> {
    return of({ data: [{ refId: 'A', fields: [{ name: 'time', type: FieldType.time, values: [123] }] }] });
  }
}
