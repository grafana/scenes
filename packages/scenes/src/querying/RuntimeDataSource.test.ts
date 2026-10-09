import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { Observable, of } from 'rxjs';

import { RuntimeDataSource, registerRuntimeDataSource, runtimeDataSources } from './RuntimeDataSource';

const registerRuntimeDataSourceMock = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    registerRuntimeDataSource: registerRuntimeDataSourceMock,
  }),
}));

class TestRuntimeDataSource extends RuntimeDataSource {
  public query(_: DataQueryRequest): Observable<DataQueryResponse> {
    return of({ data: [] });
  }
}

describe('RuntimeDataSource', () => {
  it('exposes instance settings built from the plugin id and uid', () => {
    const dataSource = new TestRuntimeDataSource('my-plugin', 'my-uid');

    expect(dataSource.instanceSettings).toMatchObject({
      uid: 'my-uid',
      type: 'my-plugin',
      name: 'RuntimeDataSource-my-plugin',
      meta: { id: 'my-plugin' },
    });
  });
});

describe('registerRuntimeDataSource', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    registerRuntimeDataSourceMock.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    runtimeDataSources.clear();
    warnSpy.mockRestore();
  });

  it('registers the data source with Grafana so lookups outside scenes can resolve it', () => {
    const dataSource = new TestRuntimeDataSource('my-plugin', 'my-uid');

    registerRuntimeDataSource({ dataSource });

    expect(runtimeDataSources.get('my-uid')).toBe(dataSource);
    expect(registerRuntimeDataSourceMock).toHaveBeenCalledWith({ dataSource });
  });

  it('still throws when the uid is already registered in this scenes instance', () => {
    registerRuntimeDataSource({ dataSource: new TestRuntimeDataSource('my-plugin', 'my-uid') });

    expect(() => registerRuntimeDataSource({ dataSource: new TestRuntimeDataSource('my-plugin', 'my-uid') })).toThrow(
      'A runtime data source with uid my-uid has already been registered'
    );
    expect(registerRuntimeDataSourceMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the data source available to scenes and warns when Grafana rejects the registration', () => {
    registerRuntimeDataSourceMock.mockImplementation(() => {
      throw new Error('A runtime data source with uid my-uid has already been registered');
    });
    const dataSource = new TestRuntimeDataSource('my-plugin', 'my-uid');

    expect(() => registerRuntimeDataSource({ dataSource })).not.toThrow();

    expect(runtimeDataSources.get('my-uid')).toBe(dataSource);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('my-uid'), expect.any(Error));
  });
});
