import { CustomTransformOperator, DataFrame } from '@grafana/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
} from '@grafana/scenes';

const prefixHandlerTransformation: CustomTransformOperator = () => (source: Observable<DataFrame[]>) => {
  return source.pipe(
    map((data: DataFrame[]) => {
      return data.map((frame: DataFrame) => {
        return {
          ...frame,
          fields: frame.fields.map((field) => {
            if (field.name === 'handler') {
              return {
                ...field,
                values: field.values.map((v) => 'http://www.my-api.com' + v),
              };
            }
            return field;
          }),
        };
      });
    })
  );
};

export function getTransformationsScene() {
  const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange(),
    datasource: {
      type: 'prometheus',
      uid: 'gdev-prometheus',
    },
    queries: [
      {
        refId: 'A',
        expr: 'sort_desc(avg by(handler) (rate(prometheus_http_request_duration_seconds_sum {}[5m]) * 1e3))',
        format: 'table',
        instant: true,
      },
    ],
  });

  const transformedData = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      prefixHandlerTransformation,
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
          },
          indexByName: {},
          renameByName: {},
        },
      },
      {
        id: 'renameByRegex',
        options: {
          regex: 'handler',
          renamePattern: 'Handler',
        },
      },
      {
        id: 'renameByRegex',
        options: {
          regex: 'Value',
          renamePattern: 'Average duration',
        },
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: transformedData,
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Average duration of HTTP request').build(),
        }),
      ],
    }),
  });

  return scene;
}
