import {
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneRefreshPicker,
  SceneAppPageState,
  PanelBuilders,
  SceneReactObject,
} from '@grafana/scenes';
import React from 'react';
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDynamicPageDemo(defaults: SceneAppPageState): SceneAppPage {
  const defaultTabs = [getSceneAppPage('/tab1', 'Temperature')];

  const page = new SceneAppPage({
    ...defaults,
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({}), new SceneRefreshPicker({})],
    tabs: defaultTabs,
    // render fallback page with loading message while tabs are loading
    // so user doesn't see "page not found" message
    getFallbackPage: () =>
      new SceneAppPage({
        title: 'Loading...',
        url: '',
        routePath: '*',
        getScene: () =>
          new EmbeddedScene({
            body: new SceneReactObject({
              component: () => <p>Please wait...</p>,
            }),
          }),
      }),
  });

  page.addActivationHandler(() => {
    if (page.state.tabs!.length === 1) {
      const cancel = setTimeout(() => {
        page.setState({
          tabs: [...defaultTabs, getSceneAppPage('/tab2', 'Humidity')],
          renderTitle: renderTitleWithImageSuffix,
          // remove fallback page once everything is loaded
          // so user will see "page not found" if tab is indeed non existing
          getFallbackPage: undefined,
        });
      }, 2000);
      return () => clearTimeout(cancel);
    }

    return;
  });

  return page;
}

function getSceneAppPage(url: string, name: string) {
  return new SceneAppPage({
    title: name,
    routePath: url,
    url: `${demoUrl('dynamic-page')}${url}`,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries().setTitle(name).build(),
            }),
          ],
        }),
        $data: getQueryRunnerWithRandomWalkQuery(),
      });
    },
    drilldowns: [],
  });
}

function renderTitleWithImageSuffix(title: string) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <h1>{title}</h1>
      <img src="public/img/online.svg" style={{ width: '24px', height: '24px' }} />
    </div>
  );
}
