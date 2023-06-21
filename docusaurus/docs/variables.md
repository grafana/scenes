---
id: variables
title: Variables
---

Variables are used to parameterize a scene. They are placeholders for a value that can be used in queries, panel titles, and even custom scene objects. Learn more about Grafana template variables in [the official Grafana documentation](https://grafana.com/docs/grafana/latest/dashboards/variables/).

## Supported variable types

Scenes support the following variable types:

- Query variable (`QueryVariable`) - Query-generated list of values such as metric names, server names, sensor IDs, data centers, and so on.
- Data source variable (`DataSourceVariable`) - Defines the list of data sources of a given type.
- Custom variable (`CustomVariable`) - Defines variable options manually, using a comma-separated list.
- Constant variable (`ConstantVariable`) - Defines a constant value variable.
- Text box variable (`TextBoxVariable`) - Displays a free text input field with an optional default value.

## Add variables to scenes

Follow these steps to add variables to a scene.

### Step 1. Create and customize a variable object

Start with a variable definition. The following code creates a variable that retrieves all `handler` label values for the `prometheus_http_requests_total` metric from the Prometheus data source:

```ts
const handlers = new QueryVariable({
  name: 'handler',
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  query: {
    query: 'label_values(prometheus_http_requests_total,handler)',
  },
});
```

:::note
The `datasource` used in the preceding code block refers to the core Grafana Prometheus data source plugin. Make sure your Grafana stack has this plugin installed and configured. The `query` property is the same one that you would see
in typical dashboard template variables when you view the dashboard JSON in the dashboard settings.
:::

### Step 2. Configure a scene to use variables

Define a `$variables` property for your scene using the `SceneVariableSet` object:

```ts
const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [handlers],
  }),
  body: new SceneFlexLayout({
    children: [],
  }),
});
```

### Step 3. Show a variables picker in the scene

Use the `controls` property of `EmbeddedScene` to show variable value pickers on top of the scene:

```ts
const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [handlers],
  }),
  body: new SceneFlexLayout({
    children: [],
  }),
  controls: [new VariableValueSelectors({})],
});
```

A selector that allows you to change the variable value is now shown on top of the scene.

### Step 4. Use the variable in a query

Create `SceneQueryRunner`, which will query the Prometheus data source and use the configured variable in the query:

```ts
const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  queries: [
    {
      refId: 'A',
      range: true,
      format: 'time_series',
      expr: 'rate(prometheus_http_requests_total{handler="$handler"}[5m])',
    },
  ],
});
```

Note, the `expr` property of the Prometheus query uses the `$handler` variable. Learn more about Grafana's variable syntax in [the official Grafana documentation](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/).

### Step 5. Add data to the scene

Connect `queryRunner`, which was created in the previous step, with the scene:

```ts
const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [handlers],
  }),
  $data: queryRunner,
  body: new SceneFlexLayout({
    children: [],
  }),
  controls: [new VariableValueSelectors({})],
});
```

### Step 6. Add a visualization to the scene

To show the results of the query using the `handler` variable, add a time series visualization to the scene using the `VizPanel` class:

```ts
const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [handlers],
  }),
  $data: queryRunner,
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries().build(),
      }),
    ],
  }),
  controls: [new VariableValueSelectors({})],
});
```

Change the variable value using the selector on top of the scene to see updated data in your visualization.

Following, you'll find the complete code of a scene using `QueryVariable`:

```ts
const handlers = new QueryVariable({
  name: 'handler',
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  query: {
    query: 'label_values(prometheus_http_requests_total,handler)',
  },
});

const queryRunner = new SceneQueryRunner({
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
  },
  queries: [
    {
      refId: 'A',
      range: true,
      format: 'time_series',
      expr: 'rate(prometheus_http_requests_total{handler="$handler"}[5m])',
    },
  ],
});

const scene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [handlers],
  }),
  $data: queryRunner,
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries().build(),
      }),
    ],
  }),
  controls: [new VariableValueSelectors({})],
});
```

## Macros

The variables system supports a variety of built-in macros, which are variable expressions that can be used without the need to include any additional variables.

### Global macros

| Syntax                                             | Description                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `${___url}`                                        | The current URL                                                     |
| `${__url.path}`                                    | Current URL without query parameters                                |
| `${__url.params}`                                  | Current URL query params                                            |
| `${__url.params:exclude:var-handler}`              | Current URL query params without `var-handler`                      |
| `${__url.params:include:var-handler,var-instance}` | Current URL query params with only `var-handler` and `var-instance` |

Use a string similar to the following to create a data link from a table to another page with all query parameters preserved:

- `/scene-x/my-drilldown-view/${__value.raw}${__url.params}`

Use a string similar to the following to update the current scene URL with a new query parameter or update it if it exists:

- `/my-scene-url${__url.params:exclude:drilldown-id}&drilldown-id=${__value.raw}`

This will generate a URL with preserved url state but with the drilldown-id query parameter updated to the interpolated value for this specific data link.

### Field / series macros

The following macros work in data links and in field overrides properties like displayName.

| Syntax                      | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `${__field.name}`           | Will interpolate to the field/series name      |
| `${__field.labels.cluster}` | Will interpolate to value of the cluster label |

### Value / row macros

The following macros work in row and value based data links.

| Syntax                     | Description                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- |
| `${__value.text}`          | Useful for data links in tables and other visualizations that render rows/values |
| `${__value.raw}`           | Unformatted value                                                                |
| `${__data.fields[0].text}` | Will interpolate to value of the first field/column on the same row              |

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/variables.tsx)
