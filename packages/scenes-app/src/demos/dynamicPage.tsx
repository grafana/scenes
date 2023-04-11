import {
  VizPanel,
  SceneTimePicker,
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneRefreshPicker,
  SceneAppPageState,
} from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDynamicPageDemo(defaults: SceneAppPageState): SceneAppPage {
  const defaultTabs = [getSceneAppPage('/tab1', 'Temperature')];

  const page = new SceneAppPage({
    ...defaults,
    subTitle: 'Dynamic tabs, and drilldowns. Adds a tab with drilldown after 2 seconds.',
    $timeRange: new SceneTimeRange(),
    controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
    tabs: defaultTabs,
  });

  page.addActivationHandler(() => {
    if (page.state.tabs!.length === 1) {
      const cancel = setTimeout(() => {
        page.setState({
          tabs: [...defaultTabs, getSceneAppPage('/tab2', 'Humidity')],
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
    url: `${demoUrl('dynamic-page')}${url}`,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                key: '3',
                pluginId: 'timeseries',
                title: name,
              }),
            }),
          ],
        }),
        $data: getQueryRunnerWithRandomWalkQuery(),
      });
    },
    drilldowns: [],
  });
}
