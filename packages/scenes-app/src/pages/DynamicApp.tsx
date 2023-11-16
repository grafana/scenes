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
} from '@grafana/scenes';
import React from 'react';
import { prefixRoute } from '../utils/utils.routing';
import { Spinner } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from '../demos/utils';
import { DynamicAppSettings } from './DynamicAppSettings';
import { AppSettings } from './shared';
import { loadSettings, saveSettings } from './loadSettings';
import { locationService } from '@grafana/runtime';

interface DynamicAppState extends SceneObjectState {
  settings?: AppSettings;
}

export class DynamicApp extends SceneObjectBase<DynamicAppState> {
  constructor(state: DynamicAppState) {
    super(state);
    this.addActivationHandler(() => {
      this._activationHandler();
    });
  }

  private async _activationHandler() {
    if (!this.state.settings) {
      // Set loading page
      this._updatePages([getLoadingPage()]);
    }

    const settings = await loadSettings();
    this.setState({ settings });

    if (settings.isConfigured) {
      this._updatePages(buildAppPages(settings));
    } else {
      this._updatePages([getFirstSetupPage()]);
    }
  }

  private _updatePages(pages: SceneAppPage[]) {
    const app = sceneGraph.getAncestor(this, SceneApp);
    app.setState({ pages });
  }

  public onChangeSettings = (settings: Partial<AppSettings>) => {
    this.setState({ settings: { ...this.state.settings, ...settings } });
    saveSettings(this.state.settings!);

    if (this.state.settings?.isConfigured) {
      this._updatePages(buildAppPages(this.state.settings!));
    }
  };

  public onCompleteSetup = () => {
    this.onChangeSettings({ isConfigured: true });
    locationService.push(prefixRoute('dynamic-app'));
  };
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

export function getLoadingPage(): SceneAppPage {
  return new SceneAppPage({
    title: 'Dynamic app',
    url: `${prefixRoute('dynamic-app')}`,
    getScene: getLoadingScene,
    getFallbackPage: () => {
      return new SceneAppPage({
        title: 'Dynamic app',
        url: `${prefixRoute('dynamic-app')}`,
        getScene: getLoadingScene,
      });
    },
  });
}

export function getFirstSetupPage(): SceneAppPage {
  return new SceneAppPage({
    title: 'Initial app setup',
    subTitle: 'Before using the app you have a few settings to configure',
    url: `${prefixRoute('dynamic-app')}/settings`,
    getScene: getSettingsScene,
  });
}

function getLoadingScene() {
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

export function buildAppPages(settings: AppSettings): SceneAppPage[] {
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
          getScene: getOverviewScene(settings),
        }),
        new SceneAppPage({
          title: 'Settings',
          url: `${prefixRoute('dynamic-app')}/settings`,
          preserveUrlKeys: [],
          getScene: getSettingsScene,
        }),
      ],
    }),
  ];
}

function getOverviewScene(settings: AppSettings) {
  return () => {
    return new EmbeddedScene({
      $variables: getDataSourceVariable(settings),
      ...getEmbeddedSceneDefaults(),
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            minWidth: '70%',
            body: getVisualization(settings),
          }),
        ],
      }),
    });
  };
}

function getVisualization(settings: AppSettings) {
  const panel = PanelBuilders.timeseries()
    .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPoints: 50 }))
    .setTitle('Trends');

  if (settings.showPanelDescriptions) {
    panel.setDescription('This is a panel description');
  }

  return panel.build();
}

function getSettingsScene() {
  return new EmbeddedScene({
    body: new DynamicAppSettings({}),
  });
}

function getDataSourceVariable(settings: AppSettings) {
  return new SceneVariableSet({
    variables: [
      new DataSourceVariable({
        name: 'ds',
        pluginId: 'grafana-testdata-datasource',
        value: settings.initialDataSource,
      }),
    ],
  });
}
