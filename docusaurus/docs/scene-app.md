---
id: scene-app
title: Building apps with Scenes
---

:::note
**Before you begin**: You must already know about building Grafana plugins before continuing with this guide. Learn more in the [official Grafana documentation](https://grafana.com/docs/grafana/latest/developers/plugins/).
:::

Scenes come with the following objects that make it easy to build highly interactive Grafana app plugins:

- `SceneApp`
- `SceneAppPage`

## SceneApp

`SceneApp` is the root object you must use to take full advantage of Scenes and Grafana plugin integration. `SceneApp` provides support for the routing of your Scenes app.

### Step 1. Create a Scenes app

Define a new Scenes app using the `SceneApp` object :

```tsx
function getSceneApp() {
  return new SceneApp({
    pages: [],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}
```

### Step 2. Render the Scenes app in a plugin

Define a component that will render the Scenes app:

```tsx
function MyApp() {
  const scene = useSceneApp(getSceneApp);

  return <scene.Component model={scene} />;
}
```

:::note
Memoize and cache the creation of your `SceneApp` instance using useSceneApp hook. This is very important for url syncing to work properly and it also makes sure data and scene app state
is not lost when users move away from your app and back.
:::

In the app plugin, render the Scenes app:

```tsx
export class App extends React.PureComponent<AppRootProps> {
  render() {
    return (
      <PluginPropsContext.Provider value={this.props}>
        <MyApp />
      </PluginPropsContext.Provider>
    );
  }
}
```

:::note
The preceding example will render a blank page because the `pages` property in the `SceneApp` constructor is empty. Use the `SceneAppPage` object to render scenes in your app.
:::

## SceneAppPage

The `SceneAppPage` object allows you to render scenes in app plugins easily. In addition to rendering scenes, it provides support for:

- Routing
- Grafana breadcrumbs integration
- [Tabs navigation](./scene-app-tabs.md)
- [Drill-down pages](./scene-app-drilldown.md)

Use `SceneAppPage` to build your app pages. It accepts the following properties:

```ts
  /** Page title */
  title: string;
  /** Page subTitle */
  subTitle?: string;
  /** For an image before title */
  titleImg?: string;
  /** For an icon before title */
  titleIcon?: IconName;
  /** Use to provide absolute page URL, for example, /app/overview **/
  url: string;
  /** Use to provide parametrized page URL, for example, /app/overview/:clusterId **/
  routePath?: string;
  /** Array of scene object to be rendered at the top right of the page, inline with the page title */
  controls?: SceneObject[];
  /** Controls whether or not page should be visible in the breadcrumbs path **/
  hideFromBreadcrumbs?: boolean;
  /** Array of SceneAppPage objects that are used as page tabs displayed at the top of the page **/
  tabs?: SceneAppPageLike[];
  /** Function that returns a scene object for the page **/
  getScene?: (routeMatch: SceneRouteMatch) => EmbeddedScene;
  /** Array of scenes used for drilldown views **/
  drilldowns?: SceneAppDrilldownView[];
  /** Function that returns a parent page object, used to create breadcrumbs structure **/
  getParentPage?: () => SceneAppPageLike;
  /** Array of query params that will be preserved in breadcrumb and page tab links, for example, ['from', 'to', 'var-datacenter',...] **/
  preserveUrlKeys?: string[];
```

### Step 1. Create a scene

First, create a scene to be rendered within `SceneApp`:

```tsx
const getScene = () => {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '<PROVIDE_GRAFANA_DS_UID>',
    },
    queries: [
      {
        refId: 'A',
        expr: 'rate(prometheus_http_requests_total{}[5m])',
      },
    ],
  });

  return new EmbeddedScene({
    $data: queryRunner,
    $timeRange: new SceneTimeRange(),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.timeseries().build(),
        }),
      ],
    }),
  });
};
```

### Step 2. Create `SceneAppPage`

Use the `SceneAppPage` object to configure an app page:

```tsx
const myAppPage = new SceneAppPage({
  title: 'Grafana Scenes App',
  url: '/a/<PLUGIN_ID>',
  getScene: getScene,
});
```

### Step 3. Add a page to `SceneApp`

```tsx
const getSceneApp = () =>
  new SceneApp({
    pages: [myAppPage],
  });
```

Navigating to `https://your-grafana.url/a/<PLUGIN_ID>` will render a Scenes app with a page containing a Time series panel that visualizes the number of Prometheus HTTP requests.
