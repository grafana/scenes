import { of } from 'rxjs';

import {
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  toDataFrame,
} from '@grafana/data';

import { SceneTimeRange } from '../core/SceneTimeRange';

import { SceneQueryRunner } from './SceneQueryRunner';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestVariable } from '../variables/variants/TestVariable';

const getDataSourceMock = jest.fn().mockReturnValue({
  getRef: () => ({ uid: 'test' }),
});

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame([
        [100, 1],
        [200, 2],
        [300, 3],
      ]),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

let sentRequest: DataQueryRequest | undefined;

jest.mock('@grafana/runtime', () => ({
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    sentRequest = request;
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
}));

describe('SceneQueryRunner', () => {
  afterEach(() => {
    runRequestMock.mockClear();
    getDataSourceMock.mockClear();
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
  });

  describe('when container width changed during deactivation', () => {
    it('and container width is 0 but previously was rendered', async () => {
      const timeRange = new SceneTimeRange();
      const queryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A' }],
        $timeRange: timeRange,
      });

      expect(queryRunner.state.data).toBeUndefined();

      queryRunner.activate();
      // When consumer viz is rendered with width 1000
      await new Promise((r) => setTimeout(r, 1));

      const runRequestCall1 = runRequestMock.mock.calls[0];
      // should be run with default maxDataPoints
      expect(runRequestCall1[1].maxDataPoints).toEqual(500);

      queryRunner.setContainerWidth(1000);
      queryRunner.deactivate();
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
    it('should run queries', async () => {
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

    it('Should execute query again after variable changed while inactive', async () => {
      const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
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

      // simulate we collapse a part of the scene where this query runner is
      queryRunner.deactivate();

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

      // Deactivate scene which deactivates SceneVariableSet
      scene.deactivate();

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
  });
});
