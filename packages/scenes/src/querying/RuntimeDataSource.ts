import { DataQuery, DataSourceApi, DataSourceInstanceSettings, PluginType } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

export abstract class RuntimeDataSource<TQuery extends DataQuery = DataQuery> extends DataSourceApi<TQuery> {
  public instanceSettings: DataSourceInstanceSettings;

  public constructor(pluginId: string, uid: string) {
    const instanceSettings: DataSourceInstanceSettings = {
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
    };

    super(instanceSettings);
    this.instanceSettings = instanceSettings;
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

  // Scenes is bundled per plugin, so the map above is invisible to Grafana. Warn rather than throw,
  // because another plugin may already own the uid in Grafana's registry.
  try {
    getDataSourceSrv().registerRuntimeDataSource({ dataSource });
  } catch (error) {
    console.warn(
      `Could not register runtime data source ${dataSource.uid} with Grafana, it is only available within scenes`,
      error
    );
  }
}
