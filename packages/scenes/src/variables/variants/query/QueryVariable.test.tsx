import { lastValueFrom, of } from 'rxjs';
import React from 'react';

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
  StandardVariableQuery,
  StandardVariableSupport,
  toDataFrame,
  toUtc,
  VariableRefresh,
  VariableSupportType,
} from '@grafana/data';
import { SceneTimeRange } from '../../../core/SceneTimeRange';

import { QueryVariable } from './QueryVariable';
import { QueryRunner, RunnerArgs, setCreateQueryVariableRunnerFactory } from './createQueryVariableRunner';
import { EmbeddedScene } from '../../../components/EmbeddedScene';
import { SceneVariableSet } from '../../sets/SceneVariableSet';
import { VariableValueSelectors } from '../../components/VariableValueSelectors';
import { SceneCanvasText } from '../../../components/SceneCanvasText';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { config, setRunRequest } from '@grafana/runtime';
import { SafeSerializableSceneObject } from '../../../utils/SafeSerializableSceneObject';
import { VariableSort } from '@grafana/schema';

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame({
        fields: [{ name: 'text', type: FieldType.string, values: ['val1', 'val2', 'val11'] }],
      }),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

setRunRequest(runRequestMock);

const getDataSourceMock = jest.fn();

const fakeDsMock: DataSourceApi = {
  name: 'fake-std',
  type: 'fake-std',
  getRef: () => ({ type: 'fake-std', uid: 'fake-std' }),
  query: () =>
    Promise.resolve({
      data: [],
    }),
  testDatasource: () => Promise.resolve({ status: 'success', message: 'abc' }),
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
  config: {
    buildInfo: {
      version: '1.0.0',
    },
    theme2: {
      visualization: {
        getColorByName: jest.fn().mockReturnValue('red'),
      },
    },
  },
}));

class FakeQueryRunner implements QueryRunner {
  public constructor(private datasource: DataSourceApi, private _runRequest: jest.Mock) {}

  public getTarget(variable: QueryVariable) {
    return (this.datasource.variables as StandardVariableSupport<DataSourceApi>).toDataQuery(
      variable.state.query as StandardVariableQuery
    );
  }
  public runRequest(args: RunnerArgs, request: DataQueryRequest) {
    return this._runRequest(
      this.datasource,
      request,
      (this.datasource.variables as StandardVariableSupport<DataSourceApi>).query
    );
  }
}

describe.each(['11.1.2', '11.1.1'])('QueryVariable', (v) => {
  beforeEach(() => {
    config.buildInfo.version = v;
  });

  describe('When empty query is provided', () => {
    it('Should default to empty query', async () => {
      const variable = new QueryVariable({ name: 'test' });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.query).toEqual('');
      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([]);
    });

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
            { label: 'val1', value: 'val1' },
            { label: 'val2', value: 'val2' },
            { label: 'val11', value: 'val11' },
          ]);
          expect(variable.state.loading).toEqual(false);
          done();
        },
      });

      expect(variable.state.loading).toEqual(true);
    });

    describe('When extra properties are received', () => {
      it('Should provide value objects', async () => {
        setCreateQueryVariableRunnerFactory(
          () =>
            new FakeQueryRunner(
              fakeDsMock,
              jest.fn().mockReturnValue(
                of<PanelData>({
                  state: LoadingState.Done,
                  series: [
                    toDataFrame({
                      fields: [
                        {
                          name: 'properties',
                          type: FieldType.other,
                          values: [
                            { id: 'test', display: 'Test', location: 'US' },
                            { id: 'prod', display: 'Prod', location: 'EU' },
                          ],
                        },
                      ],
                    }),
                  ],
                  timeRange: getDefaultTimeRange(),
                })
              )
            )
        );

        const variable = new QueryVariable({
          name: 'test',
          datasource: { uid: 'fake-std', type: 'fake-std' },
          query: 'query',
          optionsProvider: {
            type: 'query',
            valueProp: 'id',
            textProp: 'display',
          },
        });

        await lastValueFrom(variable.validateAndUpdate());

        expect(variable.getValue('location')).toEqual('US');
        expect(variable.getValue()).toEqual('test');
      });
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

      expect((runRequestCall[1].scopedVars.__sceneObject.value as SafeSerializableSceneObject).valueOf()).toEqual(
        variable
      );
      expect((getDataSourceCall[1].__sceneObject.value as SafeSerializableSceneObject).valueOf()).toEqual(variable);
    });

    describe('when refresh on dashboard load set', () => {
      it('Should issue variable query with current time range', async () => {
        const variable = new QueryVariable({
          name: 'test',
          datasource: { uid: 'fake-std', type: 'fake-std' },
          query: 'query',
        });

        const scene = new EmbeddedScene({
          $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
          $variables: new SceneVariableSet({ variables: [variable] }),
          body: new SceneCanvasText({ text: 'hello' }),
        });
        scene.activate();

        await lastValueFrom(variable.validateAndUpdate());

        const call = runRequestMock.mock.calls[0];
        expect(call[1].range.raw.from).toEqual('now-5m');
        expect(call[1].range.raw.to).toEqual('now');
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
          from: 'now-1h',
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

  describe('When ds is null', () => {
    beforeEach(() => {
      setCreateQueryVariableRunnerFactory(() => new FakeQueryRunner(fakeDsMock, runRequestMock));
    });

    it('should get options for default ds', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: null,
        query: 'query',
        regex: '/^A/',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(runRequestMock).toBeCalledTimes(1);
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
        regex: '/^val1/',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'val1', value: 'val1' },
        { label: 'val11', value: 'val11' },
      ]);
    });
  });

  describe('When sort is provided', () => {
    beforeEach(() => {
      setCreateQueryVariableRunnerFactory(() => new FakeQueryRunner(fakeDsMock, runRequestMock));
    });

    it('should return options order by natural sort Desc', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        sort: 8,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'val11', value: 'val11' },
        { label: 'val2', value: 'val2' },
        { label: 'val1', value: 'val1' },
      ]);
    });

    it('should return options order by natural sort Asc', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        sort: 7,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'val1', value: 'val1' },
        { label: 'val2', value: 'val2' },
        { label: 'val11', value: 'val11' },
      ]);
    });

    it('should return options order by alphabeticalAsc', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        sort: 1,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'val1', value: 'val1' },
        { label: 'val11', value: 'val11' },
        { label: 'val2', value: 'val2' },
      ]);
    });
  });

  describe('Query with __searchFilter', () => {
    beforeEach(() => {
      runRequestMock.mockClear();
      setCreateQueryVariableRunnerFactory(() => new FakeQueryRunner(fakeDsMock, runRequestMock));
    });

    it('Should trigger new query and show new options', async () => {
      const variable = new QueryVariable({
        name: 'server',
        datasource: null,
        query: 'A.$__searchFilter',
      });

      const scene = new EmbeddedScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        controls: [new VariableValueSelectors({})],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      render(<scene.Component model={scene} />);

      await act(() => new Promise((r) => setTimeout(r, 10)));

      const select = await screen.findByRole('combobox');

      await userEvent.click(select);
      await userEvent.type(select, 'muu!');

      // wait for debounce
      await act(() => new Promise((r) => setTimeout(r, 500)));

      expect(runRequestMock).toBeCalledTimes(2);
      expect(runRequestMock.mock.calls[1][1].scopedVars.__searchFilter.value).toEqual('muu!');
    });

    it('Should not trigger new query whern __searchFilter is not present', async () => {
      const variable = new QueryVariable({
        name: 'server',
        datasource: null,
        query: 'A.*',
      });

      const scene = new EmbeddedScene({
        $variables: new SceneVariableSet({ variables: [variable] }),
        controls: [new VariableValueSelectors({})],
        body: new SceneCanvasText({ text: 'hello' }),
      });

      render(<scene.Component model={scene} />);

      await act(() => new Promise((r) => setTimeout(r, 10)));

      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.type(select, 'muu!');

      // wait for debounce
      await new Promise((r) => setTimeout(r, 500));

      expect(runRequestMock).toBeCalledTimes(1);
    });
  });

  describe('When static options are provided', () => {
    it('Should prepend static options to the query results when no static options order is provided', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        staticOptions: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
        { label: 'val1', value: 'val1' },
        { label: 'val2', value: 'val2' },
        { label: 'val11', value: 'val11' },
      ]);
    });

    it('Should prepend static options to the query results when static order "before" is provided"', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        staticOptions: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        staticOptionsOrder: 'before',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
        { label: 'val1', value: 'val1' },
        { label: 'val2', value: 'val2' },
        { label: 'val11', value: 'val11' },
      ]);
    });

    it('Should append static options to the query results when static order "after" is provided', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        staticOptions: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        staticOptionsOrder: 'after',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'val1', value: 'val1' },
        { label: 'val2', value: 'val2' },
        { label: 'val11', value: 'val11' },
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
      ]);
    });

    it('Should sort static options and query results when static order "sorted" is provided', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        sort: VariableSort.alphabeticalAsc,
        staticOptions: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'val12', value: 'val12' },
        ],
        staticOptionsOrder: 'sorted',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'val1', value: 'val1' },
        { label: 'val11', value: 'val11' },
        { label: 'val12', value: 'val12' },
        { label: 'val2', value: 'val2' },
      ]);
    });

    it('Should deduplicate options if both query results and static options have the same value, preferring static option', async () => {
      const variable = new QueryVariable({
        name: 'test',
        datasource: { uid: 'fake-std', type: 'fake-std' },
        query: 'query',
        staticOptions: [
          { label: 'A', value: 'A' },
          { label: 'val3', value: 'val11' },
        ],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'val3', value: 'val11' },
        { label: 'val1', value: 'val1' },
        { label: 'val2', value: 'val2' },
      ]);
    });
  });
});
