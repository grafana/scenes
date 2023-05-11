---
id: transformations
title: Transformations
---

:::info
Please make sure to learn about [connecting data in Scene apps](./core-concepts.md#data-and-time-range) before continuing with this guide.
:::

Transformations are a powerful way to manipulate data returned by `SceneQueryRunner` before Scenes render a visualization. Using transformations, you can:

- Rename fields
- Join time series data
- Perform mathematical operations across queries
- Use the output of one transformation as the input to another transformation

With transformations you can query data once, manipulate it and display in a scene.

Learn more about Grafana Transformations in [Grafana documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/).

## Transform query results in a scene

### Step 1. Create a scene

Create a scene with a single table panel and a Prometheus query. The example query returns average duration of HTTP request for Prometheus API endpoints. The resulting table consists of 3 columns: `Time`, `handler` and `Value`.

```tsx
const queryRunner = new SceneQueryRunner({
  $timeRange: new SceneTimeRange(),
  datasource: {
    type: 'prometheus',
    uid: '<PROVIDE_GRAFANA_DS_UID>',
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

const myScene = new EmbeddedScene({
  $data: queryRunner,
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          title: 'Average duration of HTTP request',
          pluginId: 'table',
        }),
      }),
    ],
  }),
});
```

### Step 2. Configure data transformation

The resulting table from the previous step looks similar to the one below:

| Time                    | handler                    | Value  |
| ----------------------- | -------------------------- | ------ |
| 2023-05-09 14:00:00.000 | /metrics                   | 1.10   |
| 2023-05-09 14:00:00.000 | /api/v1/label/:name/values | 0.361  |
| 2023-05-09 14:00:00.000 | /api/v1/metadata           | 0.113  |
| 2023-05-09 14:00:00.000 | /api/v1/query_range        | 0.0847 |
| 2023-05-09 14:00:00.000 | /api/v1/query              | 0.14   |
| 2023-05-09 14:00:00.000 | /api/v1/labels             | 0.0194 |
| 2023-05-09 14:00:00.000 | /api/v1/series             | 0      |
| 2023-05-09 14:00:00.000 | /api/v1/status/buildinfo   | 0      |

Add [_Organize fields_ transformation](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/#organize-fields), that will hide the Time field:

Create a `SceneDataTransformer` object:

```tsx
const transformedData = new SceneDataTransformer({
  $data: queryRunner,
  transformations: [
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
  ],
});
```

:::note
Objects used in `transformations` are the same transformation configuration objects you would see in your normal dashboard panels when you view `Panel JSON` from the panel inspect drawer. You find the panel inspect drawer in the panel menu under the name `Inspect`.
:::

Use newly created `transformedData` object in place of previously used `SceneQueryRunner`:

```tsx
const myScene = new EmbeddedScene({
  $data: transformedData,
  body: new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: new VizPanel({
          title: 'Average duration of HTTP request',
          pluginId: 'table',
        }),
      }),
    ],
  }),
});
```

The resulting table will look similar to the one below:

| handler                    | Value  |
| -------------------------- | ------ |
| /metrics                   | 1.10   |
| /api/v1/label/:name/values | 0.361  |
| /api/v1/metadata           | 0.113  |
| /api/v1/query_range        | 0.0847 |
| /api/v1/query              | 0.14   |
| /api/v1/labels             | 0.0194 |
| /api/v1/series             | 0      |
| /api/v1/status/buildinfo   | 0      |

### Step 3. Configure multiple transformations

`SceneDataTransformer` allows configuring multiple transformations. They are executed in the same order as they are added to `transformations` array.

Modify `transformedData` object and add [_Rename by regex_ transformations](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/#rename-by-regex), that will rename field names: `handler` to `Handler` and `Value` to `Avgerage duration`

```tsx
const transformedData = new SceneDataTransformer({
  $data: queryRunner,
  transformations: [
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
```

The resulting table will look similar to the one below:

| Handler                    | Average duration |
| -------------------------- | ---------------- |
| /metrics                   | 1.10             |
| /api/v1/label/:name/values | 0.361            |
| /api/v1/metadata           | 0.113            |
| /api/v1/query_range        | 0.0847           |
| /api/v1/query              | 0.14             |
| /api/v1/labels             | 0.0194           |
| /api/v1/series             | 0                |
| /api/v1/status/buildinfo   | 0                |

## Add custom transformations

On top of all transformations available in Grafana, Scenes allow you to create custom transformations.

`SceneDataTransformer ` accepts `CustomTransformOperator` as an item of `transformations` array:

```ts
  transformations: Array<DataTransformerConfig | CustomTransformOperator>;
```

The `CustomTransformOperator` is a function which returns RxJS Operator that transforms data.

```ts
type CustomTransformOperator = (context: DataTransformContext) => MonoTypeOperatorFunction<DataFrame[]>;
```

:::info
Read more about RxJS operators in [RxJS official documentation](https://rxjs.dev/guide/operators)
:::

### Step 1. Create custom transformation

Create custom transformation that will apply to `handler` field and prefix all values with an URL.

:::info
Custom transformations depend heavily on manipulating internal Grafana data objects called Data frames. Read more about Data frames in [the official Grafana documentation](https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/).
:::

```ts
import { DataFrame } from '@grafana/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
```

### Step 2. Use custom transformation

Add custom transformation to previously created `transformedData` object.

```tsx
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
```

:::note
The `prefixHandlerTransformation` custom transformation is added as the first one because it applies to `handler` field thate is renamed to `Handler` in the following transformations. You can modify the custom transformation implementation so that it doesn't have to be used prior other transformations.
:::

The resulting table will look similar to the one below:

| Handler                                           | Average duration |
| ------------------------------------------------- | ---------------- |
| `http://www.my-api.com/metrics`                   | 1.10             |
| `http://www.my-api.com/api/v1/label/:name/values` | 0.361            |
| `http://www.my-api.com/api/v1/metadata`           | 0.113            |
| `http://www.my-api.com/api/v1/query_range`        | 0.0847           |
| `http://www.my-api.com/api/v1/query`              | 0.14             |
| `http://www.my-api.com/api/v1/labels`             | 0.0194           |
| `http://www.my-api.com/api/v1/series`             | 0                |
| `http://www.my-api.com/api/v1/status/buildinfo`   | 0                |

## Combine and filter

One powerful thing you can do with transformations (custom and built-in) is share query results between panels in interesting ways. This allows you to place most of your queries in a single query runner that lives at the top of the scene. Then you can use a `SceneDataTransformer` objects on the `VizPanel` level to join and filter the resulting data in different ways. Some panels may need the result of two of the queries, and another needs the results of all of them.

It's easy to filter the resulting `DataFrame` array by which query they came from using the `refId` property on `DataFrame`.
