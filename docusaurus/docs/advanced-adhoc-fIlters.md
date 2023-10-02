---
id: advanced-adhoc-filters
title: Adhoc filters
---

Adhoc filters provide a very powerful way to dynamically change the scope or filtering of queries in your scene view. Unlike variables, which usually control a predefined label or dimension with adhoc filters,
the user can control which keys (labels) to filter on.

## Automically applied to queries

Adhoc filters are supported directly by many data sources. This means they will handle automtically applying the filters to all the queries that match the data source you specify on the AdhocFilterSet.

### Step 1. Create the AdHocFilterSet

Start by defining the AdHocFilterSet.

```ts
const filterSet = new AdHocFilterSet({
  name: 'Filters',
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  // You do no need to set baseFilters but they are useful if you want to limit label suggestions to only those you deem relevant for the scene.
  // These are not shown in the UI
  baseFilters: [{ key: '__name__', operator: '=', value: 'ALERTS', condition: '' }],
  // If you want to have any default filters added by default you can specify those here
  filters: []
});
```

Next you just add this filterSet to the controls array of your EmbeddedScene or SceneAppPage depending on where you want it.


### How the automatic mode works

The behavior of `AdHocFilterSet` is controlled by the `applyMode` option. When set to `same-datasource`, which is the default, any change to any filter will automatically re-trigger all
SceneQueryRunners in the scene that are configured with the same data source uid as the that of the `AdHocFilterSet`. The data source implementation will handle modifying all the queries
to include the current filters.

## Customizing the tag and value suggestions

By default the tag (label) suggestions will come from the data source implementation of `getTagKeys``. Existing filters and `baseFilters`  should be taken into account when suggestions are fetched so that filters
can also impact the suggested tags and values of other filters. This behavior that other filters are taken into account is new and not all data sources support it yet.

Values are fetched from the data source implementation of `getTagValues`. Both tag keys and tag values can be customized with the two state properties: `getTagKeysProvider` and `getTagValuesProvider`.

Example:

```ts
const filterSet = new AdHocFilterSet({
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
        ]
    });
  },
  getTagValuesProvider: (set: AdHocFilterSet, filter: AdHocVariableFilter) => {
    // Customize value look up
    return Promise.resolve({ replace: false, values: [] });
  },
});
```

With these two functions you can completely customize the key and value look up. With the replace property on the return object you can control if the result should either replace the default implementation (results) or augment the default result with for example keys/labels from another data source.

## Manual mode and using AdHocFiltersVariable

If you do not want filters to be applied to all queries of the same data source as that of the `AdHocFilterSet` and want more control over which queries it is applied to you can set `applyMode` to `manual` and
then use the filters how ever you want. You could for example subscribe to the `AdHocFilterSet` state and then use the filters to modify the scene in some interesting way.

There is another way you can use the manual mode and that is via the `AdHocFiltersVariable`. This object is an alternative to `AdHocFilterSet`. With `AdHocFiltersVariable` you
do not add it the controls array you add it to a `SceneVariableSet` as one of your variables. The UI is then rendered as part of `VariableValueSelectors`.

Example:

```ts
$variables: new SceneVariableSet({
  variables: [
    AdHocFiltersVariable.create({
      datasource: { uid: 'gdev-prometheus' },
      filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
    }),
  ],
}),
```

As you can see `AdHocFiltersVariable` should not be created using the normal constructor but the static factory function `AdHocFiltersVariable.create`. This factory function helps create both the variable
and the inner `AdHocFilterSet` and makes sure the inner set has `applyMode` set to `manual`.

With this variable you can now use the filters easily in specific queries by using it as a normal variable.

Example:

```ts
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
```

As you can see the query contains the variable expression `$Filters`. The name of the variable is of course something you can change. By default the `AdHocFiltersVariable` will render the filters to valid
Prometheus label filter expressions separated by a comma.



