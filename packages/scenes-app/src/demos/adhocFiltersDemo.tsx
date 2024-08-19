import { VariableHide } from '@grafana/data';
import {
  SceneFlexLayout,
  SceneTimeRange,
  SceneVariableSet,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneQueryRunner,
  AdHocFiltersVariable,
  SceneCanvasText,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectRef,
} from '@grafana/scenes';
import { Button, Stack } from '@grafana/ui';
import React from 'react';
import { getEmbeddedSceneDefaults } from './utils';

export function getAdhocFiltersDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: `Adhoc filters variable can be used in auto mode. By default datasources will apply the filters automatically to all queries of the same data source.
     In manual mode you can use it as a normal variable in queries or use it programmtically.
    `,
    tabs: [
      new SceneAppPage({
        title: 'Apply mode auto',
        url: `${defaults.url}/auto`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  name: 'Filters',
                  // Only want keys for this series
                  baseFilters: [{ key: '__name__', operator: '=', value: 'ALERTS', condition: '' }],
                  datasource: { uid: 'gdev-prometheus' },
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS',
                            format: 'table',
                            instant: true,
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
      new SceneAppPage({
        title: 'Apply mode manual',
        url: `${defaults.url}/manual`,
        getScene: () => {
          const filtersVar = new AdHocFiltersVariable({
            applyMode: 'manual',
            datasource: { uid: 'gdev-prometheus' },
            filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
          });

          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [filtersVar],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Using AdHocFilterSet in manual mode allows you to use it as a normal variable. The query below is interpolated to ALERTS{$Filters}`,
                    fontSize: 14,
                  }),
                }),
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new Buttons({ filtersVar: filtersVar.getRef() }),
                }),
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS{$Filters}',
                            format: 'table',
                            instant: true,
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
            $timeRange: new SceneTimeRange(),
          });
        },
      }),

      new SceneAppPage({
        title: 'Vertical Variants',
        url: `${defaults.url}/vertical`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  name: 'no-button-text',
                  layout: 'vertical',
                  label: 'Without add filter button text',
                  hide: VariableHide.hideLabel,
                  datasource: { uid: 'gdev-prometheus' },
                  filters: [{ key: 'job', operator: '=', value: 'has no text', condition: '' }],
                }),
                new AdHocFiltersVariable({
                  name: 'button-text',
                  layout: 'vertical',
                  label: 'With add filter button text',
                  hide: VariableHide.hideLabel,
                  addFilterButtonText: 'Add a filter',
                  datasource: { uid: 'gdev-prometheus' },
                  filters: [{ key: 'job', operator: '=', value: 'has text on add button', condition: '' }],
                }),

                new AdHocFiltersVariable({
                  name: 'button-text',
                  layout: 'vertical',
                  label: 'With add filter button text',
                  hide: VariableHide.hideLabel,
                  addFilterButtonText: 'Filter',
                  datasource: { uid: 'gdev-prometheus' },
                  filters: [{ key: 'job', operator: '=', value: 'also has text on add button', condition: '' }],
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Using AdHocFilterSet in manual mode allows you to use it as a normal variable. The query below is interpolated to ALERTS{$Filters}`,
                    fontSize: 14,
                  }),
                }),
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS{$Filters}',
                            format: 'table',
                            instant: true,
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
            $timeRange: new SceneTimeRange(),
          });
        },
      }),
      new SceneAppPage({
        title: 'New Filters UI',
        url: `${defaults.url}/new-filters`,
        getScene: () => {
          return new EmbeddedScene({
            ...getEmbeddedSceneDefaults(),
            $variables: new SceneVariableSet({
              variables: [
                new AdHocFiltersVariable({
                  name: 'no-button-text',
                  label: 'Without add filter button text',
                  hide: VariableHide.hideLabel,
                  datasource: { uid: 'gdev-prometheus' },
                  filters: [{ key: 'job', operator: '=', value: 'has no text', condition: '' }],
                  layout: 'combobox',
                }),
              ],
            }),
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  ySizing: 'content',
                  body: new SceneCanvasText({
                    text: `Using AdHocFilterSet in manual mode allows you to use it as a normal variable. The query below is interpolated to ALERTS{}`,
                    fontSize: 14,
                  }),
                }),
                new SceneFlexItem({
                  body: PanelBuilders.table()
                    .setTitle('ALERTS')
                    .setData(
                      new SceneQueryRunner({
                        datasource: { uid: 'gdev-prometheus' },
                        queries: [
                          {
                            refId: 'A',
                            expr: 'ALERTS',
                            format: 'table',
                            instant: true,
                          },
                        ],
                      })
                    )
                    .build(),
                }),
              ],
            }),
            $timeRange: new SceneTimeRange(),
          });
        },
      }),
    ],
  });
}

interface ButtonsState extends SceneObjectState {
  filtersVar: SceneObjectRef<AdHocFiltersVariable>;
}

class Buttons extends SceneObjectBase<ButtonsState> {
  static Component = ({ model }: SceneComponentProps<Buttons>) => {
    const filterVar = model.state.filtersVar.resolve();

    const onClear = () => {
      filterVar.setState({ filters: [], hide: VariableHide.hideVariable });
    };

    const onAddFilter = () => {
      filterVar.setState({
        filters: [{ key: 'job', operator: '=', value: 'has no text', condition: '' }],
        hide: VariableHide.dontHide,
      });
    };

    return (
      <Stack>
        <Button onClick={onClear}>Clear</Button>
        <Button onClick={onAddFilter}>Add filter</Button>
      </Stack>
    );
  };
}
