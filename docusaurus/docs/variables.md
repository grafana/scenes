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
const handler = new QueryVariable({
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
const myScene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [labels],
  }),
  body: new SceneFlexLayout({
    children: [],
  }),
});
```

### Step 3. Show a variables picker in the scene

Use the `controls` property of `EmbeddedScene` to show variable value pickers on top of the scene:

```ts
const myScene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [labels],
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
const myScene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [labels],
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
const myScene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [labels],
  }),
  $data: queryRunner,
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          pluginId: 'timeseries',
        }),
      }),
    ],
  }),
  controls: [new VariableValueSelectors({})],
});
```

Change the variable value using the selector on top of the scene to see updated data in your visualization.

Following, you'll find the complete code of a scene using `QueryVariable`:

```ts
const labels = new QueryVariable({
  name: 'labels',
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

const myScene = new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [labels],
  }),
  $data: queryRunner,
  body: new SceneFlexLayout({
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          pluginId: 'timeseries',
        }),
      }),
    ],
  }),
  controls: [new VariableValueSelectors({})],
});
```
