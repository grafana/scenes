import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { VariableControl } from '../components/VariableControl';
import { DataSourceVariable } from './DataSourceVariable';
import { DataSourceVariable as DataSourceVariableObject } from '@grafana/scenes';
import { Observable, map, of } from 'rxjs';
import { DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';

const getDataSourceMock = jest.fn().mockReturnValue({
  query: () =>
    of({
      data: [],
    }),
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: any = {};

  return (ds.query(request) as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      return result;
    })
  );
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
}));

const DataSourceVariableClass = jest.requireActual('@grafana/scenes').DataSourceVariable;

describe('DatasourceVariable', () => {
  beforeEach(() => {
    jest.spyOn(DataSourceVariableClass.prototype, 'getValueOptions').mockImplementation(() => of([]));
  });

  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource">
          <VariableControl name="dsVar" />
        </DataSourceVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('dsVar');

    expect(variable).toBeDefined();
    expect(screen.getByText('dsVar')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource" label="test1">
          <VariableControl name="dsVar" />
        </DataSourceVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('dsVar') as DataSourceVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(screen.getByText('test1')).toBeInTheDocument();

    rerender(
      <TestContextProvider value={scene}>
        <DataSourceVariable name="dsVar" pluginId="grafana-testdata-datasource" label="test2">
          <VariableControl name="dsVar" />
        </DataSourceVariable>
      </TestContextProvider>
    );

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test2');
    expect(screen.getByText('test2')).toBeInTheDocument();
  });
});
