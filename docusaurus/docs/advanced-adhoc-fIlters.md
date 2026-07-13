---
id: advanced-adhoc-filters
title: Adhoc filters
---

Adhoc filters provide a very powerful way to dynamically change the scope or filtering of queries in your scene view. Unlike variables, which usually control a predefined label or dimension, with adhoc filters
the user can control which keys (labels) to filter on.

## Automically applied to queries

Adhoc filters are supported directly by many data sources. This means they handle automatically applying filters to all the queries that match the data source you specify on the `AdHocFiltersVariable`.

### Step 1. Create the AdHocFiltersVariable

Start by defining the `AdHocFiltersVariable`.

```ts
const filtersVar = new AdHocFiltersVariable({
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
```

Next, you add this `filtersVar` to variables array of your SceneVariableSet.

Example:

```ts
const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({ variables: [filterVar] }),
  ...
});
```

### How automatic mode works

The behavior of `AdHocFiltersVariable` is controlled by the `applyMode` option. When set to `auto`, which is the default, any change to any filter will automatically re-trigger all
`SceneQueryRunners` in the scene that are configured with the same data source UID as the one of the `AdHocFiltersVariable`. The data source implementation will handle modifying all the queries
to include the current filters.

## Customize the tag and value suggestions

By default the tag (label) suggestions will come from the data source implementation of `getTagKeys`. You should take existing filters and `baseFilters` into account when fetching suggestions so that filters
can also impact the suggested tags and values of other filters. This behavior that other filters are taken into account is new and not all data sources support it yet.

Values are fetched from the data source implementation of `getTagValues`. Both tag keys and tag values can be customized with the two state properties: `getTagKeysProvider` and `getTagValuesProvider`.

Example:

```ts
const filterSet = new AdHocFiltersVariable({
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
  getTagValuesProvider: (set: AdHocFilterSet, filter: AdHocVariableFilter) => {
    // Customize value look up
    return Promise.resolve({ replace: false, values: [] });
  },
});
```

With these two functions, you can completely customize the key and value look up. With the `replace` property on the return object, you can control if the result should either replace the default implementation (results) or augment the default result with, for example, keys/labels from another data source.

## Manual mode

If you don't want filters to be applied to all queries of the same data source as that of the `AdHocFiltersVariable` and want more control over which queries it's applied to, you can set `applyMode` to `manual` and
then use the filters however you want. You could, for example, subscribe to the `AdHocFiltersVariable` state and then use the filters to modify the scene in some interesting way.

An alternative way to the filters as a normal variable inside query expressions.

Example:

```ts
$variables: new SceneVariableSet({
  variables: [
    new AdHocFiltersVariable({
      name: 'filters',
      applyMode: 'manual',
      datasource: { uid: 'gdev-prometheus' },
      filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
    }),
  ],
}),
```

With this variable, you can now use the filters easily in specific queries by using it as a normal variable.

Example:

```ts
new SceneQueryRunner({
  datasource: { uid: 'gdev-prometheus' },
  queries: [
    {
      refId: 'A',
      expr: 'ALERTS{$filters}',
      format: 'table',
      instant: true,
    },
  ],
});
```

Such configured query contains the variable expression `$filters`. You can change the name of the variable. By default, the `AdHocFiltersVariable` will render the filters to valid Prometheus label filter expressions separated by a comma.

## Interpolating a single filter by key

Use bracket-quoted key syntax to interpolate the value(s) of one filter instead of the whole expression:

```ts
// filter: env = prod
'${filters["env"]}'; // -> prod
```

Both double-quoted (`["env"]`) and single-quoted (`['env']`) forms are supported. The key is matched exactly against the combined origin (scope/dashboard) and user filters; group-by entries are excluded. Keys containing dots or spaces are fine inside the brackets:

```ts
// filter: pod.name = api-0
'${filters["pod.name"]}'; // -> api-0
```

A single resolved value renders as a scalar. Multiple values - a multi-value operator (`=|` / `!=|`) or several filters sharing a key - render through the standard variable formatters:

```ts
// filter: env =| prod|staging
'${filters["env"]}'; // -> {prod,staging}  (glob default)
'${filters["env"]:csv}'; // -> prod,staging
'${filters["env"]:pipe}'; // -> prod|staging
'${filters["env"]:json}'; // -> ["prod","staging"]
'${filters["env"]:singlequote}'; // -> 'prod','staging'
```

The operator token of the (first) matching filter is available via the `.operator` accessor:

```ts
// filter: env =| prod|staging
'${filters["env"].operator}'; // -> =|
```

### Notes and limitations

- A missing key renders as an empty string (`${filters["unknown"]}` -> ``), including with a formatter.
- An unrecognized accessor (anything other than `.operator`) renders as an empty string.
- The dot form `${filters.env}` is **not** a per-key accessor. It falls through to the whole-expression behavior and logs a development-mode warning advising bracket syntax. Always use brackets for per-key access.
- The output shape depends on cardinality: a single-value key returns a scalar, so `${filters["env"]:json}` yields the raw string `"prod"` rather than `["prod"]`. This matches multi-value-variable behavior.
- A key containing a quote of the active delimiter cannot be expressed; use the other delimiter (no backslash escaping). Nested interpolation inside a key (`${filters["${other}"]}`) is not supported - the key is matched literally.
- Per-key interpolation is a `@grafana/scenes` feature; it is independent of Grafana core's `template_srv`.
