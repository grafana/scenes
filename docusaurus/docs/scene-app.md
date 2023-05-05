---
id: scene-app
title: Building apps with Scenes
---

:::info
This guide requires knowledge about building Grafana plugins. Learn more about building Grafana plugins in the [official plugins documentation](https://grafana.com/docs/grafana/latest/developers/plugins/).
:::

Scenes come with the following objects that make it easy to build highly interactive Grafana app plugins:

- `SceneApp`
- `SceneAppPage`

## SceneApp

`SceneApp` is the root object that must be used in order to take full advantage of Scenes and Grafana plugin integration. `SceneApp` provides support for routing of your Scenes app.

### Step 1. Create scene app

Define a new scene app using `SceneApp` object :

```tsx
const getSceneApp = () =>
  new SceneApp({
    pages: [],
  });
```

### Step 2. Render `SceneApp` on plugin page

In app plugin, definine a page component that will render the scene app:

```tsx
function MyPage() {
  const scene = useMemo(() => getSceneApp());

  return <scene.Component model={scene} />;
}
```

:::info
Memoize SceneApp using `React.useMemo` to avoid unnecessary re-renders.
:::

### Step 3. Create route for the scene app

In app plugin routes component create a route that will render the scene app:

```tsx
export class App extends React.PureComponent<AppRootProps> {
  render() {
    return (
      <PluginPropsContext.Provider value={this.props}>
        <Switch>
          <Route path="/a/<PLUGIN_ID>/my-page" component={MyPage} />
        </Switch>
      </PluginPropsContext.Provider>
    );
  }
}
```

:::note
The example above will render a blank page because `pages` property in the `SceneApp` constructor is empty. Use `SceneAppPage` object to render scenes in your app.
:::

## SceneAppPage

`SceneAppPage` object allows rendering scenes in app plugins easily. Apart from rendering scenes it provides support for:

- Routing
- Grafana breadcrumbs integration
- [Tabs navigation](./scene-app-tabs.md)
- [Drilldowns](./scene-app-drilldown.md)

`SceneAppPage` accepts the following properties:

```ts
  /** Page title */
  title: string;
  /** Page subTitle */
  subTitle?: string;
  /** For an image before title */
  titleImg?: string;
  /** For an icon before title */
  titleIcon?: IconName;
  /** Use to provide page absolute URL, i.e. /app/overview **/
  url: string;
  /** Use to provide parametrized page URL, i.e. /app/overview/:clusterId **/
  routePath?: string;
  /** Shown in the top right inline with the page title */
  controls?: SceneObject[];
  /** Whether or not page should be visible in the breadcrumbs path **/
  hideFromBreadcrumbs?: boolean;
  /** Array of SceneAppPage objects that are used as page tabs displayed on top of the page **/
  tabs?: SceneAppPageLike[];
  /** Function that returns a scene object for the page **/
  getScene?: (routeMatch: SceneRouteMatch) => EmbeddedScene;
  /** Array of scenes used for drilldown views **/
  drilldowns?: SceneAppDrilldownView[];
  /** Function that returns a parent page object, used to create breadcrumbs structure **/
  getParentPage?: () => SceneAppPageLike;
  /** Array of query params that will be preserved in breadcrumb and page tab links, i.e. ['from', 'to', 'var-datacenter',...] **/
  preserveUrlKeys?: string[];
```

Use `SceneAppPage` to build your app pages.

### Step 1. Create a scene

First, create a scene to be rendered within `SceneApp`:

```tsx
const getScene = () => {
  const queryRunner = new SceneQueryRunner({
    $timeRange: new SceneTimeRange()
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
    body: new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({
        minHeight: 300,
        body: new VizPanel({
          title: 'Panel title',
          pluginId: 'timeseries',
        })
      })],
    }),
  });
}
```

### Step 2. Create `SceneAppPage`

Use `SceneAppPage` object to configure app page.

```tsx
const myAppPage = new SceneAppPage({
  title: 'Grafana Scenes App',
  url: '`/a/<PLUGIN_ID>/my-app`,
  getScene: getPageScene,
});
```

### Step 3. Add page to `SceneApp`

```tsx
const getSceneApp = () =>
  new SceneApp({
    pages: [myAppPage],
  });
```

Navigating to `https://your-grafana.url/a/<PLUGIN_ID>/my-app` will render a scene app with a page containing Time series panel that visualizes number of Prometheus HTTP requests.
