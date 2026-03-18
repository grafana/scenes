import { CustomTransformOperator, DataFrame, FieldType } from '@grafana/data';
import { Observable, map } from 'rxjs';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getTransformationsTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery({
          scenarioId: 'csv_metric_values',
          stringInput: '1,20,90,30,5,0',
        }),
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: new SceneFlexLayout({
                direction: 'column',
                children: [
                  new SceneFlexItem({
                    body: new SceneFlexLayout({
                      direction: 'row',
                      children: [
                        new SceneFlexItem({
                          body: PanelBuilders.timeseries().setTitle('Source data (global query)').build(),
                        }),
                        new SceneFlexItem({
                          body: PanelBuilders.stat()
                            .setTitle('Transformed data')
                            .setData(
                              new SceneDataTransformer({
                                transformations: [
                                  {
                                    id: 'reduce',
                                    options: {
                                      reducers: ['last', 'mean'],
                                    },
                                  },
                                ],
                              })
                            )
                            .build(),
                        }),
                        new SceneFlexItem({
                          body: PanelBuilders.timeseries()
                            .setTitle('Custom transformer (log10 scale)')
                            .setData(
                              new SceneDataTransformer({
                                transformations: [log10Transform()],
                              })
                            )
                            .build(),
                        }),
                        new SceneFlexItem({
                          body: PanelBuilders.timeseries()
                            .setTitle('Custom transformer (log10 scale) that throws')
                            .setData(
                              new SceneDataTransformer({
                                transformations: [log10Transform(true)],
                              })
                            )
                            .build(),
                        }),
                      ],
                    }),
                  }),
                  new SceneFlexItem({
                    body: PanelBuilders.stat()
                      .setTitle('Query with predefined transformations')
                      .setData(
                        new SceneDataTransformer({
                          $data: getQueryRunnerWithRandomWalkQuery(),
                          transformations: [
                            {
                              id: 'reduce',
                              options: {
                                reducers: ['mean'],
                              },
                            },
                          ],
                        })
                      )
                      .build(),
                  }),
                  new SceneFlexItem({
                    body: PanelBuilders.stat()
                      .setTitle('Datasoure and transformations error')
                      .setData(
                        new SceneDataTransformer({
                          $data: getQueryRunnerWithRandomWalkQuery({ datasource: { uid: 'nonexistent' } }),
                          transformations: [log10Transform(true)],
                        })
                      )
                      .build(),
                  }),
                ],
              }),
            }),
          ],
        }),
      });
    },
  });
}

const log10Transform: (shouldThrow?: boolean) => CustomTransformOperator =
  (shouldThrow = false) =>
  () =>
  (source: Observable<DataFrame[]>) => {
    return source.pipe(
      map((data: DataFrame[]) => {
        return data.map((frame) => {
          if (shouldThrow) {
            data[1999].fields = [];
          }

          return {
            ...frame,
            fields: frame.fields.map((field) => {
              if (field.type === FieldType.number) {
                return {
                  ...field,
                  values: field.values.map((v) => Math.log(v) / Math.log(10)),
                };
              }

              return field;
            }),
          };
        });
      })
    );
  };
