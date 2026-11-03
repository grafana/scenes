import { getDataSourceInstance } from '@grafana/plugin-compat/datasources';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  getDataSourceInstance: jest.fn(),
}));

const getDataSourceInstanceMock = jest.mocked(getDataSourceInstance);

describe('AdHocFiltersVariable data source resolution', () => {
  const datasource = { uid: 'test-uid', type: 'test' };

  function setup() {
    const ds = {
      getTagKeys: jest.fn().mockResolvedValue([{ text: 'key1', value: 'key1' }]),
      getTagValues: jest.fn().mockResolvedValue([{ text: 'value1', value: 'value1' }]),
    };
    getDataSourceInstanceMock.mockResolvedValue(ds as never);
    const variable = new AdHocFiltersVariable({
      datasource,
      filters: [{ key: 'key1', operator: '=', value: '' }],
    });
    return { ds, variable };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the data source through the async API to get keys', async () => {
    const { ds, variable } = setup();

    const keys = await variable._getKeys(null);

    expect(getDataSourceInstanceMock).toHaveBeenCalledWith(datasource, expect.anything());
    expect(ds.getTagKeys).toHaveBeenCalledTimes(1);
    expect(keys).toEqual([expect.objectContaining({ value: 'key1' })]);
  });

  it('resolves the data source through the async API to get values', async () => {
    const { ds, variable } = setup();

    const values = await variable._getValuesFor(variable.state.filters[0]);

    expect(getDataSourceInstanceMock).toHaveBeenCalledWith(datasource, expect.anything());
    expect(ds.getTagValues).toHaveBeenCalledTimes(1);
    expect(values).toEqual([expect.objectContaining({ value: 'value1' })]);
  });
});
