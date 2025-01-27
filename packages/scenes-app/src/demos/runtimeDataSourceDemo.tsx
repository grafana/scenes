import {
  DataQuery,
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  MetricFindValue,
  TestDataSourceResponse,
} from '@grafana/data';
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
  SceneVariableSet,
  QueryVariable,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';
import { Observable } from 'rxjs';
import { LoadingState } from '@grafana/schema';

export function getRuntimeDataSourceDemo(defaults: SceneAppPageState): SceneAppPage {
  sceneUtils.registerRuntimeDataSource({ dataSource: new MyCustomDS('my-custom-ds', 'my-custom-ds-uid') });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new QueryVariable({
              name: 'test',
              query: { refId: 'A', query: 'A' },
              datasource: { uid: 'my-custom-ds-uid', type: 'my-custom-ds' },
            }),
          ],
        }),
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

  metricFindQuery(query: any, options?: any): Promise<MetricFindValue[]> {
    return Promise.resolve([
      { text: 'value1-from-runtime-ds', value: 'value1-from-runtime-ds' },
      { text: 'value2-from-runtime-ds', value: 'value2-from-runtime-ds' },
    ]);
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}
