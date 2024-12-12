import { DataSourceApi, PluginType } from '@grafana/data';

class RuntimeDataSource extends DataSourceApi {
  constructor(pluginId, uid) {
    super({
      name: "RuntimeDataSource-" + pluginId,
      uid,
      type: pluginId,
      id: 1,
      readOnly: true,
      jsonData: {},
      access: "direct",
      meta: {
        id: pluginId,
        name: "RuntimeDataSource-" + pluginId,
        type: PluginType.datasource,
        info: {
          author: {
            name: ""
          },
          description: "",
          links: [],
          logos: {
            large: "",
            small: ""
          },
          screenshots: [],
          updated: "",
          version: ""
        },
        module: "",
        baseUrl: ""
      }
    });
  }
  testDatasource() {
    return Promise.resolve({});
  }
}
const runtimeDataSources = /* @__PURE__ */ new Map();
function registerRuntimeDataSource({ dataSource }) {
  if (runtimeDataSources.has(dataSource.uid)) {
    throw new Error(`A runtime data source with uid ${dataSource.uid} has already been registered`);
  }
  runtimeDataSources.set(dataSource.uid, dataSource);
}

export { RuntimeDataSource, registerRuntimeDataSource, runtimeDataSources };
//# sourceMappingURL=RuntimeDataSource.js.map
