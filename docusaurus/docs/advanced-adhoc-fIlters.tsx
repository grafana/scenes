import {
  AdHocFiltersVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';

import { AdHocVariableFilter } from '@grafana/data';

export function adhocFiltersExamples() {
  // @ts-ignore
  const filterSet1 = new AdHocFiltersVariable({
    name: 'Filters',
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    // You don't need to set baseFilters, but they're useful if you want to limit label suggestions to only those you deem relevant for the scene.
    // These are not shown in the UI.
    baseFilters: [{ key: '__name__', operator: '=', value: 'ALERTS', condition: '' }],
    // If you want to have any default filters added by default, you can specify those here.
    filters: [],
  });

  // @ts-ignore
  const filterSet2 = new AdHocFiltersVariable({
    name: 'Filters',
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    getTagKeysProvider: () => {
      return Promise.resolve({
        replace: true,
        values: [
          { text: 'service_namespace', value: 'service_namespace' },
          { text: 'technology', value: 'technology' },
        ],
      });
    },
    getTagValuesProvider: (variable: AdHocFiltersVariable, filter: AdHocVariableFilter) => {
      // Customize value look up
      return Promise.resolve({ replace: false, values: [] });
    },
  });

  // This scene is only showing the variable use case scenario
  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [
        new AdHocFiltersVariable({
          datasource: { uid: 'gdev-prometheus' },
          filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
          applyMode: 'manual',
        }),
      ],
    }),
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          $data: new SceneQueryRunner({
            datasource: { uid: 'gdev-prometheus' },
            queries: [
              {
                refId: 'A',
                expr: 'ALERTS{$Filters}',
                format: 'table',
                instant: true,
              },
            ],
          }),
          body: PanelBuilders.timeseries().build(),
        }),
      ],
    }),
    controls: [new VariableValueSelectors({})],
  });

  return scene;
}
