import { DataQuery, DataSourceApi, PluginType } from '@grafana/data';

export abstract class RuntimeDataSource<TQuery extends DataQuery = DataQuery> extends DataSourceApi<TQuery> {
  public constructor(pluginId: string, uid: string) {
    super({
      name: 'RuntimeDataSource-' + pluginId,
      uid: uid,
      type: pluginId,
      id: 1,
      readOnly: true,
      jsonData: {},
      access: 'direct',
      meta: {
        id: pluginId,
        name: 'RuntimeDataSource-' + pluginId,
        type: PluginType.datasource,
        info: {
          author: {
            name: '',
          },
          description: '',
          links: [],
          logos: {
            large: '',
            small: '',
          },
          screenshots: [],
          updated: '',
          version: '',
        },
        module: '',
        baseUrl: '',
      },
    });
  }

  public testDatasource(): Promise<any> {
    return Promise.resolve({});
  }
}

export const runtimeDataSources = new Map<string, RuntimeDataSource>();

export interface RuntimeDataSourceOptions {
  dataSource: RuntimeDataSource;
}

/**
 * Provides a way to register runtime panel plugins.
 * Please use a pluginId that is unlikely to collide with other plugins.
 */
export function registerRuntimeDataSource({ dataSource }: RuntimeDataSourceOptions) {
  if (runtimeDataSources.has(dataSource.uid)) {
    throw new Error(`A runtime data source with uid ${dataSource.uid} has already been registered`);
  }

  runtimeDataSources.set(dataSource.uid, dataSource);
}
