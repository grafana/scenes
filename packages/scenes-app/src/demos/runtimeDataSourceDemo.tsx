import { DataQuery, DataQueryRequest, DataQueryResponse, FieldType, TestDataSourceResponse } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneFlexItem,
  EmbeddedScene,
  VizPanel,
  SceneAppPageState,
  SceneAppPage,
  sceneUtils,
  SceneQueryRunner,
  RuntimeDataSource,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';
import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';

export function getRuntimeDataSourceDemo(defaults: SceneAppPageState): SceneAppPage {
  sceneUtils.registerRuntimeDataSource({ dataSource: new MyCustomDS('my-custom-ds', 'my-custom-ds-uid') });

  return new SceneAppPage({
    ...defaults,
    subTitle: 'Demo of a runtime registered panel plugin',
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          ...getEmbeddedSceneDefaults(),
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                title: 'Data coming from custom runtime registered data source',
                pluginId: 'table',
                $data: new SceneQueryRunner({
                  datasource: { uid: 'my-custom-ds-uid', type: 'my-custom-ds' },
                  queries: [{ refId: 'A', query: 'A' }],
                }),
              }),
            }),
          ],
        }),
      });
    },
  });
}

class MyCustomDS extends RuntimeDataSource {
  query(request: DataQueryRequest<DataQuery>): Promise<DataQueryResponse> | Observable<DataQueryResponse> {
    return Promise.resolve({
      state: LoadingState.Done,
      data: [
        {
          fields: [{ name: 'Values', type: FieldType.number, values: [1, 2, 3], config: {} }],
          length: 3,
        },
      ],
    });
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}
