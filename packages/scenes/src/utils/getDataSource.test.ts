import { DataSourceApi } from '@grafana/data';
import { getDataSourceInstance } from '@grafana/plugin-compat/datasources';
import { RuntimeDataSource, runtimeDataSources } from '../querying/RuntimeDataSource';
import { getDataSource } from './getDataSource';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  getDataSourceInstance: jest.fn(),
}));

const getDataSourceInstanceMock = jest.mocked(getDataSourceInstance);

class TestRuntimeDataSource extends RuntimeDataSource {
  public query() {
    return Promise.resolve({ data: [] });
  }
}

describe('getDataSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the data source through the async data source API', async () => {
    const ds = { uid: 'prom-uid' } as DataSourceApi;
    getDataSourceInstanceMock.mockResolvedValue(ds);
    const scopedVars = {};

    const result = await getDataSource({ uid: 'prom-uid', type: 'prometheus' }, scopedVars);

    expect(result).toBe(ds);
    expect(getDataSourceInstanceMock).toHaveBeenCalledWith({ uid: 'prom-uid', type: 'prometheus' }, scopedVars);
  });

  it('returns a registered runtime data source without calling the async API', async () => {
    const runtimeDs = new TestRuntimeDataSource('runtime-plugin', 'runtime-uid');
    runtimeDataSources.set('runtime-uid', runtimeDs);

    const result = await getDataSource({ uid: 'runtime-uid' }, {});

    expect(result).toBe(runtimeDs);
    expect(getDataSourceInstanceMock).not.toHaveBeenCalled();
    runtimeDataSources.delete('runtime-uid');
  });

  it('returns the argument itself when it already is a data source instance', async () => {
    const ds = { query: jest.fn() } as unknown as DataSourceApi;

    const result = await getDataSource(ds as never, {});

    expect(result).toBe(ds);
    expect(getDataSourceInstanceMock).not.toHaveBeenCalled();
  });
});
