---
id: variables
title: Variables
---

Variables are used to parametrize a scene. They are placeholders for a value that can be used in queries, panel titles and even custom scene objects. You can read more about Grafana template variables in [Grafana documentation](https://grafana.com/docs/grafana/latest/dashboards/variables/).

## Supported variable types

Scenes support the following variable types

- Query variable (`QueryVariable`) - Query-generated list of values such as metric names, server names, sensor IDs, data centers, and so on.
- Data source variable (`DataSourceVariable`) - Define list of data sources of a given type.
- Custom variable (`CustomVariable`) - Define the variable options manually using a comma-separated list.
- Constant variable (`ConstantVariable`) - Define a constant value variable.
- Text box variable (`TextBoxVariable`) - Display a free text input field with an optional default value.

## Add variables to scene

### Step 1. Create and customize variable object

Start with variable definition. The following code will create a variable that will retrieve all `handler` label values for `prometheus_http_requests_total` metric from Prometheus data source.

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
The `datasource` used above refers to the core Grafana Prometheus datasource plugin. Make sure your Grafana instance has this plugin installed and configured. The `query` property is the same that you would see
in your normal dashboard template variables when you view dashboard JSON in Dashboard settings.
:::

### Step 2. Configure scene to use variables

Define `$variables` property for your scene using `SceneVariableSet` object:

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

### Step 3. Show variables picker in scene

Use `controls` property of `EmbeddedScene` to show variable value pickers on top of the scene:

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

This will result with the select shown on top of the scene, that will allow changing the variable value.

### Step 4. Use variable in a query

Create `SceneQueryRunner` that will query Prometheus data source and use the configured variable in the query:

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

Note the `expr` property of Prometheus query using `$handler` variable. Learn more about Grafana's variable syntax in [Grafana documentation](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/).

### Step 5. Add data to scene

Connect `queryRunner` created in previous step with scene:

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

### Step 6. Add visualization to scene

To show the results of the query using `handler` variable, add a Time series visualization to scene using the `VizPanel` class.

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

Change variable value using the select on top of the scene to see updated data in your visualization.

Below you will find the complete code of a scene using `QueryVariable`:

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
