import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanelMenu,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getPanelMenuTest(defaults: SceneAppPageState): SceneAppPage {
  const data = getQueryRunnerWithRandomWalkQuery();
  const menuItems = [
    {
      text: 'Item 1',
      onClick: () => {
        alert('Item 1 clicked');
      },
    },
    {
      text: 'Item 2',
      onClick: () => {
        alert('Item 2 clicked');
      },
    },
  ];
  const lazyMenu = new VizPanelMenu({});
  lazyMenu.addActivationHandler(() => {
    setTimeout(() => {
      lazyMenu.setItems(menuItems);
    }, 1000);
  });

  const staticMenu = new VizPanelMenu({
    items: menuItems,
  });

  const staticMenuViaActivation = new VizPanelMenu({});
  staticMenuViaActivation.addActivationHandler(() => {
    staticMenuViaActivation.setItems(menuItems);
  });

  const dynamicMenu = new VizPanelMenu({});
  let ctr = 1;
  dynamicMenu.addActivationHandler(() => {
    setTimeout(() => {
      const message = `Item ${ctr} clicked`;
      dynamicMenu.addItem({
        text: `Item ${ctr}`,
        onClick: () => {
          alert(message);
        },
      });
      ctr++;
    }, 500);
  });

  const readingFromPanelMenu = new VizPanelMenu({});
  const panelWithMenu = PanelBuilders.timeseries()
    .setTitle('Menu reading from panel state')
    .setMenu(readingFromPanelMenu)
    .build();

  readingFromPanelMenu.addActivationHandler(() => {
    const plugin = panelWithMenu.getPlugin();

    readingFromPanelMenu.setItems([
      {
        text: `Alert plugin type`,
        onClick: () => {
          alert(plugin?.meta.id);
        },
      },
      {
        text: `Change ${plugin?.meta.id} panel title`,
        onClick: () => {
          panelWithMenu.setState({ title: `Updated title ${Math.floor(Math.random() * 100) + 1}` });
        },
      },
      {
        text: `Change number of  series`,
        onClick: () => {
          data.setState({
            queries: [
              {
                ...data.state.queries[0],
                seriesCount: Math.floor(Math.random() * 10) + 1,
              },
            ],
          });
          data.runQueries();
        },
      },
    ]);
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          $data: data,
          direction: 'row',
          wrap: 'wrap',
          children: [
            new SceneFlexItem({
              minHeight: 200,
              minWidth: '40%',
              body: PanelBuilders.timeseries().setTitle('Basic static menu').setMenu(staticMenu).build(),
            }),
            new SceneFlexItem({
              minHeight: 200,
              minWidth: '40%',
              body: PanelBuilders.timeseries().setTitle('Basic lazy menu').setMenu(staticMenuViaActivation).build(),
            }),
            new SceneFlexItem({
              minHeight: 200,
              minWidth: '40%',
              body: PanelBuilders.timeseries().setTitle('Async menu, will show after 1s').setMenu(lazyMenu).build(),
            }),
            new SceneFlexItem({
              minHeight: 200,
              minWidth: '40%',
              body: PanelBuilders.timeseries()
                .setTitle('New item added to menu after it is shown')
                .setMenu(dynamicMenu)
                .build(),
            }),
            new SceneFlexItem({
              minHeight: 200,
              minWidth: '40%',
              body: panelWithMenu,
            }),
          ],
        }),
      });
    },
  });
}
