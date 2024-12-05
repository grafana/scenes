---
id: advanced-custom-datasource
title: Custom data sources
---

If you want to query a custom resource API, you can register a runtime data source. There are great benefits to this because you can then leverage `SceneQueryRunner`.

`SceneQueryRunner` does a lot of complex work for you like:

- Wait for variables to complete (if your queries depend on them)
- Re-execute variables when a time range changes
- Figure out if variables changed while inactive

```typescript
class MyCustomDS extends RuntimeDataSource {
  query(request: DataQueryRequest<DataQuery>): Promise<DataQueryResponse> | Observable<DataQueryResponse> {
    return Promise.resolve({
      state: LoadingState.Done,
      data: [
        {
          fields: [{ name: 'Values', type: FieldType.number, values: [1, 2, 3], config: {} }],
          length: 3,
        },
      ],
    });
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'OK' });
  }
}

// Important to specify a unique pluginId and uid for your data source that is unlikely to confict with any other scene app plugin.
sceneUtils.registerRuntimeDataSource({ dataSource: new MyCustomDS('my-custom-ds', 'my-custom-ds-uid') });
```

You can now use this data source in `SceneQueryRunner` queries using the same uid. If you want to mix queries to standard data sources and your custom data source in the same `SceneQueryRunner`, use the mixed data source.

Example:

```typescript
$data: new SceneQueryRunner({
  datasource: { uid: '-- Mixed --' },
  queries: [
    { refId: 'A', datasource: { uid: 'my-prometheus' }, expr: '<my prometheus query>' },
    { refId: 'B', datasource: { uid: 'my-custom-ds-uid' }, expr: '<my prometheus query>' },
  ],
});
```
