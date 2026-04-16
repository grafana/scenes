import { PanelData, RawTimeRange, ScopedVars } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { AdHocFilterItem } from '@grafana/ui';
import { getExploreURL } from './explore';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { wrapInSafeSerializableSceneObject } from './wrapInSafeSerializableSceneObject';

const mockDataSourceSrv = {
  get: jest.fn(),
};

const mockDataSource = {
  interpolateVariablesInQueries: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => mockDataSourceSrv,
}));

interface TestQuery extends DataQuery {
  query: string;
}

describe('getExploreURL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSourceSrv.get.mockReturnValue(mockDataSource);
    mockDataSource.interpolateVariablesInQueries.mockImplementation(
      (queries: DataQuery[], scopedVars: ScopedVars, filters: AdHocFilterItem[]) => {
        return queries.map((q) => ({ ...q, query: (q as TestQuery).query + ' interpolated' }));
      }
    );
  });

  it('should handle a single query from a single datasource and return a well-formed Explore URL', async () => {
    const data: PanelData = {
      request: {
        targets: [
          {
            datasource: { uid: 'test-ds' },
            refId: 'A',
            query: 'test-query',
          },
        ],
        filters: [],
      },
    } as any;

    const model = new VizPanel({ pluginId: 'custom-plugin-id' });
    const timeRange: RawTimeRange = { from: 'now - 10m', to: 'now' };

    const url = await getExploreURL(data, model, timeRange);

    const expectedLeft = {
      datasource: 'test-ds',
      queries: [
        {
          datasource: { uid: 'test-ds' },
          refId: 'A',
          query: 'test-query interpolated',
        },
      ],
      range: timeRange,
    };

    expect(mockDataSourceSrv.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.interpolateVariablesInQueries).toHaveBeenCalledWith(
      [data.request!.targets[0]],
      { __sceneObject: wrapInSafeSerializableSceneObject(model) },
      data.request!.filters
    );

    const parsed = new URL(url, 'http://example.com');
    expect(parsed.pathname).toBe('/explore');
    const left = parsed.searchParams.get('left');
    expect(left).not.toBeNull();
    expect(JSON.parse(decodeURIComponent(left!))).toStrictEqual(expectedLeft);
  });

  it('should handle multiple queries from different datasources and return a well-formed Explore URL', async () => {
    const data: PanelData = {
      request: {
        targets: [
          {
            datasource: { uid: 'prometheus-ds' },
            refId: 'Prom A',
            query: 'prometheus_query',
          },
          {
            datasource: { uid: 'loki-ds' },
            refId: 'Loki B',
            query: 'loki_query',
          },
        ],
        filters: [],
      },
    } as any;

    const model = new VizPanel({ pluginId: 'custom-plugin-id' });
    const timeRange: RawTimeRange = { from: 'now - 10m', to: 'now' };

    const url = await getExploreURL(data, model, timeRange, (query) => query);

    const expectedLeft = {
      datasource: '-- Mixed --',
      queries: [
        {
          datasource: { uid: 'prometheus-ds' },
          refId: 'Prom A',
          query: 'prometheus_query interpolated',
        },
        {
          datasource: { uid: 'loki-ds' },
          refId: 'Loki B',
          query: 'loki_query interpolated',
        },
      ],
      range: timeRange,
    };

    expect(mockDataSourceSrv.get).toHaveBeenCalledTimes(2);
    expect(mockDataSource.interpolateVariablesInQueries).toHaveBeenCalledTimes(2);
    expect(mockDataSource.interpolateVariablesInQueries).toHaveBeenNthCalledWith(
      1,
      [data.request!.targets[0]],
      { __sceneObject: wrapInSafeSerializableSceneObject(model) },
      data.request!.filters
    );
    expect(mockDataSource.interpolateVariablesInQueries).toHaveBeenNthCalledWith(
      2,
      [data.request!.targets[1]],
      { __sceneObject: wrapInSafeSerializableSceneObject(model) },
      data.request!.filters
    );

    const parsed = new URL(url, 'http://example.com');
    expect(parsed.pathname).toBe('/explore');
    const left = parsed.searchParams.get('left');
    expect(left).not.toBeNull();
    expect(JSON.parse(decodeURIComponent(left!))).toStrictEqual(expectedLeft);
  });
});
