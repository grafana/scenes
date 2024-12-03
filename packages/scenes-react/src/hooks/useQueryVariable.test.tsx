import { renderHook } from '@testing-library/react';
import { getHookContextWrapper } from '../utils/testUtils';
import { useQueryVariable } from './useQueryVariable';
import { of } from 'rxjs';
import {
  DataSourceApi,
  DataSourceRef,
  FieldType,
  LoadingState,
  PanelData,
  PluginType,
  ScopedVars,
  VariableSupportType,
  getDefaultTimeRange,
  toDataFrame,
} from '@grafana/data';
import { setRunRequest } from '@grafana/runtime';
import { QueryVariable } from '@grafana/scenes';

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
}));

describe('useQueryVariable', () => {
  it('Should create and return query variable', async () => {
    const { wrapper } = getHookContextWrapper({});

    const { result } = renderHook(useQueryVariable, {
      wrapper,
      initialProps: {
        name: 'test',
        datasource: 'fake',
        query: 'query',
        regex: '/.*/',
      },
    });

    const variable = result.current;

    expect(variable?.state.query).toBe('query');
    expect(variable?.state.datasource?.uid).toBe('fake');
    expect(variable?.state.regex).toBe('/.*/');
  });

  it('Should find, update and return query variable', async () => {
    const variable = new QueryVariable({
      name: 'test',
      datasource: { uid: 'fake' },
      query: 'query',
      regex: '/.*/',
    });

    const { wrapper } = getHookContextWrapper({
      variables: [variable],
    });

    const { result } = renderHook(useQueryVariable, {
      wrapper,
      initialProps: {
        name: 'test',
        datasource: 'other-fake',
        query: 'other-query',
        regex: '/[ABCDE]/',
      },
    });

    expect(result.current).toBe(variable);

    expect(variable?.state.query).toBe('other-query');
    expect(variable?.state.datasource?.uid).toBe('other-fake');
    expect(variable?.state.regex).toBe('/[ABCDE]/');
  });
});
