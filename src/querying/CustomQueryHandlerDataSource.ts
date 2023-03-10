import { Observable } from 'rxjs';
import { DataQuery, DataQueryRequest, DataSourceApi, DataQueryResponse, PluginType } from '@grafana/data';
import { CustomQueryHandler } from './SceneQueryRunner';

export class CustomQueryHandlerDataSource extends DataSourceApi {
  public constructor(private customQueryHandler: CustomQueryHandler) {
    super({
      name: 'CustomQueryHandlerDataSource',
      uid: 'CustomQueryHandlerDataSource',
      type: 'CustomQueryHandlerDataSource',
      id: 1,
      readOnly: true,
      jsonData: {},
      access: 'direct',
      meta: {
        id: 'CustomQueryHandlerDataSource',
        name: 'CustomQueryHandlerDataSource',
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

  public query(request: DataQueryRequest<DataQuery>): Promise<DataQueryResponse> | Observable<DataQueryResponse> {
    return this.customQueryHandler(request);
  }

  public testDatasource(): Promise<any> {
    return Promise.resolve({});
  }
}
