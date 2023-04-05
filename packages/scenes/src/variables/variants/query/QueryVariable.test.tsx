import { lastValueFrom, of } from 'rxjs';

import {
  DataQueryRequest,
  DataSourceApi,
  DataSourceRef,
  FieldType,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  PluginType,
  ScopedVars,
  StandardVariableSupport,
  toDataFrame,
  toUtc,
  VariableRefresh,
  VariableSupportType,
} from '@grafana/data';
import { SceneTimeRange } from '../../../core/SceneTimeRange';

import { QueryVariable } from './QueryVariable';
import { QueryRunner, RunnerArgs, setCreateQueryVariableRunnerFactory } from './createQueryVariableRunner';

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame({
        fields: [{ name: 'text', type: FieldType.string, values: ['A', 'AB', 'C'] }],
      }),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

const getDataSourceMock = jest.fn();

const fakeDsMock: DataSourceApi = {
  name: 'fake-std',
  type: 'fake-std',
  getRef: () => ({ type: 'fake-std', uid: 'fake-std' }),
  query: () =>
    Promise.resolve({
      data: [],
    }),
  testDatasource: () => Promise.resolve({ status: 'success' }),
  meta: {
    id: 'fake-std',
    type: PluginType.datasource,
    module: 'fake-std',
    baseUrl: '',
    name: 'fake-std',
    info: {
      author: { name: '' },
      description: '',
      links: [],
      logos: { large: '', small: '' },
      updated: '',
      version: '',
      screenshots: [],
    },
  },
  // Standard variable support
  variables: {
    getType: () => VariableSupportType.Standard,
    toDataQuery: (q) => ({ ...q, refId: 'FakeDataSource-refId' }),
  },
  id: 1,
  uid: 'fake-std',
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    get: (ds: DataSourceRef, vars: ScopedVars): Promise<DataSourceApi> => {
      getDataSourceMock(ds, vars);
      return Promise.resolve(fakeDsMock);
    },
  }),
}));

class FakeQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest: jest.Mock) {}

  public getTarget(variable: QueryVariable) {
    return (this.datasource.variables as StandardVariableSupport<DataSourceApi>).toDataQuery(variable.state.query);
  }
  public runRequest(args: RunnerArgs, request: DataQueryRequest) {
    return this._runRequest(
      this.datasource,
      request,
      (this.datasource.variables as StandardVariableSupport<DataSourceApi>).query
    );
  }
}

describe('QueryVariable', () => {
  describe('When empty query is provided', () => {
    it('Should default to empty options and empty value', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake', type: 'fake' },
        query: '',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([]);
    });
  });

  describe('When no data source is provided', () => {
    it('Should default to empty options and empty value', async () => {
      const variable = new QueryVariable({
        name: 'test',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([]);
    });
  });

  describe('Issuing variable query', () => {
    const originalNow = Date.now;
    beforeEach(() => {
      setCreateQueryVariableRunnerFactory(() => new FakeQueryRunner(fakeDsMock, runRequestMock));
    });

    beforeEach(() => {
      Date.now = jest.fn(() => 60000);
    });

    afterEach(() => {
      Date.now = originalNow;
      runRequestMock.mockClear();
      getDataSourceMock.mockClear();
    });

    it('Should resolve variable options via provided runner', (done) => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
      });

      variable.validateAndUpdate().subscribe({
        next: () => {
          expect(variable.state.options).toEqual([
            { label: 'A', value: 'A' },
            { label: 'AB', value: 'AB' },
            { label: 'C', value: 'C' },
          ]);
          expect(variable.state.loading).toEqual(false);
          done();
        },
      });

      expect(variable.state.loading).toEqual(true);
    });

    it('Should pass variable scene object when resolving data source and via request scoped vars', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
      });

      await lastValueFrom(variable.validateAndUpdate());

      const getDataSourceCall = getDataSourceMock.mock.calls[0];
      const runRequestCall = runRequestMock.mock.calls[0];

      expect(runRequestCall[1].scopedVars.__sceneObject).toEqual({ value: variable, text: '__sceneObject' });
      expect(getDataSourceCall[1].__sceneObject).toEqual({ value: variable, text: '__sceneObject' });
    });

    describe('when refresh on dashboard load set', () => {
      it('Should issue variable query with default time range', async () => {
        const variable = new QueryVariable({
          name: 'test',
          datasource: { uid: 'fake-std', type: 'fake-std' },
          query: 'query',
        });

        await lastValueFrom(variable.validateAndUpdate());

        expect(runRequestMock).toBeCalledTimes(1);
        const call = runRequestMock.mock.calls[0];
        expect(call[1].range).toEqual(getDefaultTimeRange());
      });

      it('Should not issue variable query when the closest time range changes if refresh on dahboard load is set', async () => {
        const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });

        const variable = new QueryVariable({
          name: 'test',
          datasource: { uid: 'fake-std', type: 'fake-std' },
          query: 'query',
          refresh: VariableRefresh.onDashboardLoad,
          $timeRange: timeRange,
        });

        variable.activate();

        await lastValueFrom(variable.validateAndUpdate());

        expect(runRequestMock).toBeCalledTimes(1);
        const call1 = runRequestMock.mock.calls[0];

        // Uses default time range
        expect(call1[1].range.raw).toEqual({
          from: 'now-6h',
          to: 'now',
        });

        timeRange.onTimeRangeChange({
          from: toUtc('2020-01-01'),
          to: toUtc('2020-01-02'),
          raw: { from: toUtc('2020-01-01'), to: toUtc('2020-01-02') },
        });

        await Promise.resolve();

        expect(runRequestMock).toBeCalledTimes(1);
      });
    });
  });

  describe('When regex provided', () => {
    beforeEach(() => {
      setCreateQueryVariableRunnerFactory(() => new FakeQueryRunner(fakeDsMock, runRequestMock));
    });

    it('should return options that match regex', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        regex: '/^A/',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'AB', value: 'AB' },
      ]);
    });
  });
});
