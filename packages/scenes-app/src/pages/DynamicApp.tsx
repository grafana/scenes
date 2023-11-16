import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexLayout,
  SceneFlexItem,
  SceneReactObject,
  useSceneApp,
  SceneObjectState,
  SceneObjectBase,
  sceneGraph,
  PanelBuilders,
  SceneVariableSet,
  DataSourceVariable,
  SceneComponentProps,
  SceneObject,
} from '@grafana/scenes';
import React from 'react';
import { prefixRoute } from '../utils/utils.routing';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { Button, Field, Spinner, Switch, VerticalGroup } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from '../demos/utils';
import { SceneAppState } from '@grafana/scenes/src/components/SceneApp/types';
import { DataSourcePicker } from '@grafana/runtime';

interface DynamicAppState extends SceneObjectState {
  initialDataSource?: string;
  showPanelDescriptions?: boolean;
  isInitialized?: boolean;
  isConfigured?: boolean;
  settings: DynamicAppSettings;
}

class DynamicApp extends SceneObjectBase<DynamicAppState> {
  constructor(state: DynamicAppState) {
    super(state);
    this.addActivationHandler(this._activationHandler.bind(this));
  }

  private _activationHandler() {
    if (this.state.isInitialized) {
      return;
    }

    // Set initializing (loading) page
    this._updateState({
      pages: [getInitializingPage()],
    });

    setTimeout(() => this._initializeCompleted(), 2000);
  }

  private _updateState(appState: Partial<SceneAppState>, customState?: Partial<DynamicAppState>) {
    const app = sceneGraph.getAncestor(this, SceneApp);
    app.setState(appState);

    if (customState) {
      this.setState(customState);
    }
  }

  private _initializeCompleted() {
    if (!this.state.isConfigured) {
      this._updateState(
        {
          pages: [getInitialSetupPage()],
        },
        {
          isInitialized: true,
        }
      );
    } else {
      this._updateState(
        {
          pages: buildAppPages(this.state),
        },
        {
          isInitialized: true,
        }
      );
    }
  }
}

function buildDynamicApp() {
  return new SceneApp({
    name: 'dynamic-app',
    $behaviors: [new DynamicApp({})],
    pages: [],
  });
}

export const DynamicAppPage = () => {
  const scene = useSceneApp(buildDynamicApp);
  return <scene.Component model={scene} />;
};

export function getInitializingPage(): SceneAppPage {
  return new SceneAppPage({
    title: 'Dynamic app',
    url: `${prefixRoute('dynamic-app')}`,
    getScene: getInitializingScene,
    getFallbackPage: () => {
      return new SceneAppPage({
        title: 'Dynamic app',
        url: `${prefixRoute('dynamic-app')}`,
        getScene: getInitializingScene,
      });
    },
  });
}

export function getInitialSetupPage(): SceneAppPage {
  return new SceneAppPage({
    title: 'Initial app setup',
    subTitle: 'Before using the app you have a few settings to configure',
    url: `${prefixRoute('dynamic-app')}/settings`,
    getScene: getSettingsScene,
  });
}

function getInitializingScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          body: new SceneReactObject({
            component: () => {
              return (
                <div>
                  Initalizing app <Spinner />
                </div>
              );
            },
          }),
        }),
      ],
    }),
  });
}

export function buildAppPages(state: DynamicAppState): SceneAppPage[] {
  return [
    new SceneAppPage({
      title: 'Dynamic app',
      subTitle:
        'Demo of scene app that has an initializing and setup phases and settings that should cause scenes to rebuilt',
      url: `${prefixRoute('dynamic-app')}`,
      tabs: [
        new SceneAppPage({
          title: 'Overview',
          url: `${prefixRoute('dynamic-app')}/overview`,
          getScene: getOverviewScene,
        }),
        new SceneAppPage({
          title: 'Settings',
          url: `${prefixRoute('dynamic-app')}/settings`,
          getScene: getSettingsScene,
        }),
      ],
    }),
  ];
}

function getOverviewScene() {
  return new EmbeddedScene({
    $variables: getDataSourceVariable(),
    ...getEmbeddedSceneDefaults(),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          minWidth: '70%',
          body: PanelBuilders.timeseries()
            .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }))
            .setTitle('Trends')
            .build(),
        }),
      ],
    }),
  });
}

function getSettingsScene() {
  return new EmbeddedScene({
    body: new DynamicAppSettings({}),
  });
}

class DynamicAppSettings extends SceneObjectBase<SceneObjectState> {
  public constructor(state: SceneObjectState) {
    super(state);
  }

  public onChangeDataSource = (ds: DataSourceInstanceSettings) => {};

  static Component = ({ model }: SceneComponentProps<DynamicAppSettings>) => {
    const { initialDataSource, isConfigured } = getDynamicApp(model).useState();

    return (
      <VerticalGroup>
        <Field label="Data source">
          <DataSourcePicker
            current={initialDataSource}
            pluginId="grafana-testdata-datasource"
            onChange={model.onChangeDataSource}
          />
        </Field>

        <Field label="Show panel descriptions">
          <Switch />
        </Field>

        {!isConfigured && <Button>Complete setup</Button>}
      </VerticalGroup>
    );
  };
}

function getDataSourceVariable() {
  return new SceneVariableSet({
    variables: [
      new DataSourceVariable({
        name: 'ds',
        pluginId: 'grafana-testdata-datasource',
        skipUrlSync: true,
      }),
    ],
  });
}

function getDynamicApp(model: SceneObject): DynamicApp {
  let obj = model;

  while (true) {
    if (obj.parent) {
      obj = obj.parent;
    } else if (obj instanceof SceneAppPage && obj.state.getParentPage) {
      obj = obj.state.getParentPage();
    } else {
      break;
    }
  }

  if (obj.state.$behaviors?.[0] instanceof DynamicApp) {
    return obj.state.$behaviors?.[0];
  }

  throw new Error('DynamicApp behavior not found at scene app root');
}

const getStyles = (theme: GrafanaTheme2) => ({
  root: css({
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    alignSelf: 'baseline',
    gap: theme.spacing(2),
  }),
});
